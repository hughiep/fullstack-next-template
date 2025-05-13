'use server'

import { cookies } from 'next/headers'
import { z } from 'zod'

import { prisma } from '@/shared/lib/prisma'
import { logger } from '@/shared/logger'
import { AppError } from '@/shared/types/error'

import {
  comparePasswords,
  generateTokens,
  hashPassword,
  setAuthCookies,
  verifyToken,
} from './helpers/auth'
import { storageKeys } from './storage'

// Input validation schemas
const signUpSchema = z.object({
  email: z.string().email('Invalid email address'),
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string(),
  rememberMe: z.boolean().optional().default(false),
})

/**
 * Register a new user
 */
export async function signUp(data: z.infer<typeof signUpSchema>) {
  try {
    // Validate input
    const validatedData = signUpSchema.parse(data)

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: validatedData.email },
          { username: validatedData.username },
        ],
      },
    })

    if (existingUser) {
      throw new AppError('User with this email or username already exists', {
        code: 'USER_EXISTS',
        statusCode: 409,
      })
    }

    // Hash password
    const hashedPassword = await hashPassword(validatedData.password)

    // Create user
    const newUser = await prisma.user.create({
      data: {
        email: validatedData.email,
        username: validatedData.username,
        passwordHash: hashedPassword,
        profile: {
          create: {}, // Create an empty profile
        },
      },
    })

    // Generate tokens
    const { accessToken, refreshToken } = await generateTokens(newUser.id)

    // Set cookies (don't use remember me for new registrations by default)
    await setAuthCookies(accessToken, refreshToken, false)

    logger.info('User registered successfully', { userId: newUser.id })

    // Return user (without password)
    return {
      user: {
        id: newUser.id,
        email: newUser.email,
        username: newUser.username,
      },
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.error('Validation error during sign up', { issues: error.issues })
      throw new AppError(error.issues[0].message, {
        code: 'VALIDATION_ERROR',
        statusCode: 400,
      })
    }

    if (error instanceof AppError) {
      throw error
    }

    logger.error('Sign up failed', { error })
    throw new AppError('Failed to register user', {
      code: 'REGISTRATION_FAILED',
      statusCode: 500,
    })
  }
}

/**
 * Sign in a user with email and password
 */
export async function signIn(data: z.infer<typeof signInSchema>) {
  try {
    // Validate input
    const validatedData = signInSchema.parse(data)

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: validatedData.email },
    })

    if (!user) {
      throw new AppError('Invalid email or password', {
        code: 'INVALID_CREDENTIALS',
        statusCode: 401,
      })
    }

    // Verify password
    const isPasswordValid = await comparePasswords(
      validatedData.password,
      user.passwordHash,
    )

    if (!isPasswordValid) {
      throw new AppError('Invalid email or password', {
        code: 'INVALID_CREDENTIALS',
        statusCode: 401,
      })
    }

    // Generate tokens
    const { accessToken, refreshToken } = await generateTokens(user.id)

    // Set cookies with remember-me preference
    await setAuthCookies(accessToken, refreshToken, validatedData.rememberMe)

    logger.info('User signed in successfully', {
      userId: user.id,
      rememberMe: validatedData.rememberMe,
    })

    // Return user (without password)
    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
      },
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.error('Validation error during sign in', { issues: error.issues })
      throw new AppError(error.issues[0].message, {
        code: 'VALIDATION_ERROR',
        statusCode: 400,
      })
    }

    if (error instanceof AppError) {
      throw error
    }

    logger.error('Sign in failed', { error })
    throw new AppError('Failed to authenticate user', {
      code: 'AUTHENTICATION_FAILED',
      statusCode: 500,
    })
  }
}

/**
 * Get the current user session
 */
export async function getServerSession() {
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get(storageKeys.auth.accessToken)?.value

    if (!accessToken) {
      return null
    }

    // Verify token
    const payload = await verifyToken(accessToken)

    if (!payload || !payload.sub) {
      return null
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        profile: {
          select: {
            avatarUrl: true,
          },
        },
      },
    })

    if (!user) {
      return null
    }

    return { user }
  } catch (error) {
    logger.error('Failed to get server session', { error })
    return null
  }
}

/**
 * Refresh the access token using the refresh token
 */
export async function refreshAccessToken() {
  try {
    const cookieStore = await cookies()
    const refreshToken = cookieStore.get(storageKeys.auth.refreshToken)?.value

    if (!refreshToken) {
      throw new AppError('Refresh token not found', {
        code: 'UNAUTHORIZED',
        statusCode: 401,
      })
    }

    // Verify refresh token
    const payload = await verifyToken(refreshToken)

    if (!payload || !payload.sub) {
      throw new AppError('Invalid refresh token', {
        code: 'UNAUTHORIZED',
        statusCode: 401,
      })
    }

    // Generate new tokens
    const userId = payload.sub
    const tokens = await generateTokens(userId)

    // Set cookies
    setAuthCookies(tokens.accessToken, tokens.refreshToken)

    return { success: true }
  } catch (error) {
    if (error instanceof AppError) {
      throw error
    }

    logger.error('Failed to refresh access token', { error })
    throw new AppError('Failed to refresh access token', {
      code: 'TOKEN_REFRESH_FAILED',
      statusCode: 500,
    })
  }
}

/**
 * Sign out a user by clearing cookies
 */
export async function signOut() {
  const cookieStore = await cookies()
  cookieStore.delete(storageKeys.auth.accessToken)
  cookieStore.delete(storageKeys.auth.refreshToken)
  return { success: true }
}

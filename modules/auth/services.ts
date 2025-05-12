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
      throw new AppError({
        code: 'USER_EXISTS',
        message: 'User with this email or username already exists',
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

    // Set cookies
    setAuthCookies(accessToken, refreshToken)

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
      throw new AppError({
        code: 'VALIDATION_ERROR',
        message: error.issues[0].message,
        statusCode: 400,
      })
    }

    if (error instanceof AppError) {
      throw error
    }

    logger.error('Sign up failed', { error })
    throw new AppError({
      code: 'REGISTRATION_FAILED',
      message: 'Failed to register user',
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
      throw new AppError({
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
        statusCode: 401,
      })
    }

    // Verify password
    const isPasswordValid = await comparePasswords(
      validatedData.password,
      user.passwordHash,
    )

    if (!isPasswordValid) {
      throw new AppError({
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
        statusCode: 401,
      })
    }

    // Generate tokens
    const { accessToken, refreshToken } = await generateTokens(user.id)

    // Set cookies
    setAuthCookies(accessToken, refreshToken)

    logger.info('User signed in successfully', { userId: user.id })

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
      throw new AppError({
        code: 'VALIDATION_ERROR',
        message: error.issues[0].message,
        statusCode: 400,
      })
    }

    if (error instanceof AppError) {
      throw error
    }

    logger.error('Sign in failed', { error })
    throw new AppError({
      code: 'AUTHENTICATION_FAILED',
      message: 'Failed to authenticate user',
      statusCode: 500,
    })
  }
}

/**
 * Get the current user session
 */
export async function getServerSession() {
  try {
    const cookieStore = cookies()
    const accessToken = cookieStore.get(storageKeys.auth.acessToken)?.value

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
    const cookieStore = cookies()
    const refreshToken = cookieStore.get(storageKeys.auth.refreshToken)?.value

    if (!refreshToken) {
      throw new AppError({
        code: 'UNAUTHORIZED',
        message: 'Refresh token not found',
        statusCode: 401,
      })
    }

    // Verify refresh token
    const payload = await verifyToken(refreshToken)

    if (!payload || !payload.sub) {
      throw new AppError({
        code: 'UNAUTHORIZED',
        message: 'Invalid refresh token',
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
    throw new AppError({
      code: 'TOKEN_REFRESH_FAILED',
      message: 'Failed to refresh access token',
      statusCode: 500,
    })
  }
}

/**
 * Sign out a user by clearing cookies
 */
export async function signOut() {
  const cookieStore = cookies()
  cookieStore.delete(storageKeys.auth.acessToken)
  cookieStore.delete(storageKeys.auth.refreshToken)
  return { success: true }
}

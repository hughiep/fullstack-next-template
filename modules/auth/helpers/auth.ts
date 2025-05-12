import bcrypt from 'bcrypt'
import { jwtVerify, SignJWT } from 'jose'
import { cookies } from 'next/headers'

import { prisma } from '@/shared/lib/prisma'
import { logger } from '@/shared/logger'

import { storageKeys } from '../constants/storage'

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET)

export const getAccessToken = () =>
  window.localStorage.getItem(storageKeys.auth.acessToken)
export const getRefreshToken = () =>
  window.localStorage.getItem(storageKeys.auth.refreshToken)

export const setAccessToken = (accessToken: string) =>
  window.localStorage.set(storageKeys.auth.acessToken, accessToken)

export const setRefreshToken = (refreshToken: string) =>
  window.localStorage.set(storageKeys.auth.refreshToken, refreshToken)

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10
  return bcrypt.hash(password, saltRounds)
}

/**
 * Compare a password with a hash
 */
export async function comparePasswords(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

/**
 * Generate JWT tokens for a user
 */
export async function generateTokens(userId: string) {
  try {
    // Create access token that expires in 15 minutes
    const accessToken = await new SignJWT({ sub: userId })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(process.env.JWT_ACCESS_TOKEN_EXPIRY || '15m')
      .sign(JWT_SECRET)

    // Create refresh token that expires in 7 days
    const refreshToken = await new SignJWT({ sub: userId })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(process.env.JWT_REFRESH_TOKEN_EXPIRY || '7d')
      .sign(JWT_SECRET)

    return { accessToken, refreshToken }
  } catch (error) {
    logger.error('Failed to generate tokens', error)
    throw new Error('Failed to generate authentication tokens')
  }
}

/**
 * Verify a JWT token
 */
export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload
  } catch (error) {
    logger.error('Token verification failed', error)
    return null
  }
}

/**
 * Set authentication cookies
 */
export function setAuthCookies(accessToken: string, refreshToken: string) {
  const cookieStore = cookies()

  // Set access token cookie (short-lived, HTTP-only)
  cookieStore.set(storageKeys.auth.acessToken, accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 15, // 15 minutes
    path: '/',
  })

  // Set refresh token cookie (longer-lived, HTTP-only)
  cookieStore.set(storageKeys.auth.refreshToken, refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  })
}

/**
 * Clear authentication cookies
 */
export function clearAuthCookies() {
  const cookieStore = cookies()
  cookieStore.delete(storageKeys.auth.acessToken)
  cookieStore.delete(storageKeys.auth.refreshToken)
}

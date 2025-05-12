import { NextResponse } from 'next/server'

import { prisma } from '@/shared/lib/prisma'
import { logger } from '@/shared/logger'
import { AppError } from '@/shared/types/error'
import { getServerSession } from '@/auth/services'

// GET /api/users - Get list of users (admin only)
export async function GET() {
  try {
    // Check authentication
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Admin only endpoint
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get users with pagination
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        isEmailVerified: true,
        createdAt: true,
        profile: {
          select: {
            avatarUrl: true,
            bio: true,
          },
        },
      },
    })

    return NextResponse.json({ users })
  } catch (error) {
    logger.error('Error fetching users', { error })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}

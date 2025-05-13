import { NextResponse } from 'next/server'

import { prisma } from '@/shared/lib/prisma'
import { getServerSession } from '@/modules/core/auth/services'
import { AppError } from '@/shared/types/error'
import { withApiErrorHandler } from '@/modules/shared/utilities/api-error-handler'

// GET /api/users - Get list of users (admin only)
export const GET = withApiErrorHandler(async () => {
  // Check authentication
  const session = await getServerSession()
  if (!session?.user) {
    throw new AppError({
      message: 'You must be logged in to access this resource',
      code: 'UNAUTHORIZED',
      statusCode: 401
    })
  }

  // Admin only endpoint
  if (session.user.role !== 'ADMIN') {
    throw new AppError({
      message: 'You do not have permission to access this resource',
      code: 'FORBIDDEN',
      statusCode: 403
    })
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
})
}

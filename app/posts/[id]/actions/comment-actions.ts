'use server'

import { getServerSession } from '@/modules/core/auth/services'
import { prisma } from '@/shared/lib/prisma'
import { AppError } from '@/shared/types/error'

/**
 * Add a comment to a post
 */
export async function addComment(postId: string, content: string) {
  // Check authentication
  const session = await getServerSession()
  if (!session?.user) {
    throw new AppError('You must be logged in to comment', {
      code: 'UNAUTHORIZED',
      statusCode: 401,
    })
  }

  // Create comment
  const comment = await prisma.comment.create({
    data: {
      content,
      postId,
      authorId: session.user.id,
    },
    include: {
      author: {
        select: {
          id: true,
          username: true,
          profile: {
            select: {
              avatarUrl: true,
            },
          },
        },
      },
    },
  })

  return comment
}

'use server'

import { revalidatePath } from 'next/cache'

import { getServerSession } from '@/modules/core/auth/services'
import { prisma } from '@/shared/lib/prisma'
import { AppError } from '@/shared/types/error'
import { logger } from '@/shared/logger'

/**
 * Publish a post
 */
export async function publishPost(postId: string) {
  try {
    // Get current user session
    const session = await getServerSession()

    if (!session?.user) {
      throw new AppError('You must be logged in to publish a post', {
        code: 'UNAUTHORIZED',
        statusCode: 401,
      })
    }

    // Check if post exists and user is author or admin
    const existingPost = await prisma.post.findUnique({
      where: { id: postId },
      select: { authorId: true, published: true },
    })

    if (!existingPost) {
      throw new AppError('Post not found', {
        code: 'NOT_FOUND',
        statusCode: 404,
      })
    }

    // Check if user is author or admin
    const isAuthor = existingPost.authorId === session.user.id
    const isAdmin = session.user.role === 'ADMIN'

    if (!isAuthor && !isAdmin) {
      throw new AppError('You do not have permission to publish this post', {
        code: 'FORBIDDEN',
        statusCode: 403,
      })
    }

    // If post is already published, just return it
    if (existingPost.published) {
      return { success: true }
    }

    // Publish post
    await prisma.post.update({
      where: { id: postId },
      data: { published: true },
    })

    // Revalidate all affected pages
    revalidatePath(`/posts/${postId}`)
    revalidatePath('/posts')
    revalidatePath('/profile')

    return { success: true }
  } catch (error) {
    logger.error('Failed to publish post', { error, postId })

    if (error instanceof AppError) {
      throw error
    }

    throw new AppError('Failed to publish post', {
      code: 'PUBLISH_FAILED',
      statusCode: 500,
    })
  }
}

/**
 * Unpublish a post
 */
export async function unpublishPost(postId: string) {
  try {
    // Get current user session
    const session = await getServerSession()

    if (!session?.user) {
      throw new AppError('You must be logged in to unpublish a post', {
        code: 'UNAUTHORIZED',
        statusCode: 401,
      })
    }

    // Check if post exists and user is author or admin
    const existingPost = await prisma.post.findUnique({
      where: { id: postId },
      select: { authorId: true, published: true },
    })

    if (!existingPost) {
      throw new AppError('Post not found', {
        code: 'NOT_FOUND',
        statusCode: 404,
      })
    }

    // Check if user is author or admin
    const isAuthor = existingPost.authorId === session.user.id
    const isAdmin = session.user.role === 'ADMIN'

    if (!isAuthor && !isAdmin) {
      throw new AppError('You do not have permission to unpublish this post', {
        code: 'FORBIDDEN',
        statusCode: 403,
      })
    }

    // If post is already unpublished, just return it
    if (!existingPost.published) {
      return { success: true }
    }

    // Unpublish post
    await prisma.post.update({
      where: { id: postId },
      data: { published: false },
    })

    // Revalidate all affected pages
    revalidatePath(`/posts/${postId}`)
    revalidatePath('/posts')
    revalidatePath('/profile')

    return { success: true }
  } catch (error) {
    logger.error('Failed to unpublish post', { error, postId })

    if (error instanceof AppError) {
      throw error
    }

    throw new AppError('Failed to unpublish post', {
      code: 'UNPUBLISH_FAILED',
      statusCode: 500,
    })
  }
}

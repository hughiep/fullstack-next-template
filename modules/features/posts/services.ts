'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'

import { prisma } from '@/shared/lib/prisma'
import { logger } from '@/shared/logger'
import { AppError } from '@/shared/types/error'
import { getServerSession } from '@/modules/core/auth/services'

// Validation schemas
const postCreateSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(100),
  content: z.string().min(10, 'Content must be at least 10 characters'),
  published: z.boolean().default(false),
  categoryIds: z.array(z.string()).optional(),
})

const postUpdateSchema = z.object({
  id: z.string().uuid('Invalid post ID'),
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(100)
    .optional(),
  content: z
    .string()
    .min(10, 'Content must be at least 10 characters')
    .optional(),
  published: z.boolean().optional(),
  categoryIds: z.array(z.string()).optional(),
})

/**
 * Get all published posts with pagination
 */
export async function getPublishedPosts({
  page = 1,
  limit = 10,
}: {
  page?: number
  limit?: number
} = {}) {
  try {
    const skip = (page - 1) * limit

    const [posts, totalCount] = await Promise.all([
      prisma.post.findMany({
        where: { published: true },
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
          categories: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: {
              comments: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.post.count({
        where: { published: true },
      }),
    ])

    const totalPages = Math.ceil(totalCount / limit)
    const hasNextPage = page < totalPages
    const hasPrevPage = page > 1

    return {
      posts,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage,
        hasPrevPage,
      },
    }
  } catch (error) {
    logger.error('Failed to fetch published posts', { error })
    throw new AppError({
      code: 'FETCH_FAILED',
      message: 'Failed to fetch posts',
      statusCode: 500,
    })
  }
}

/**
 * Get a single post by ID
 */
export async function getPostById(id: string) {
  try {
    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            profile: {
              select: {
                avatarUrl: true,
                bio: true,
              },
            },
          },
        },
        categories: true,
        comments: {
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
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!post) {
      throw new AppError({
        code: 'NOT_FOUND',
        message: 'Post not found',
        statusCode: 404,
      })
    }

    return { post }
  } catch (error) {
    if (error instanceof AppError) {
      throw error
    }

    logger.error('Failed to fetch post by ID', { error, postId: id })
    throw new AppError('Failed to fetch post by ID', {
      code: 'FETCH_FAILED',
      message: 'Failed to fetch post',
      statusCode: 500,
    })
  }
}

/**
 * Create a new post
 */
export async function createPost(data: z.infer<typeof postCreateSchema>) {
  try {
    // Get current user session
    const session = await getServerSession()

    if (!session?.user) {
      throw new AppError({
        code: 'UNAUTHORIZED',
        message: 'You must be logged in to create a post',
        statusCode: 401,
      })
    }

    // Validate input
    const validatedData = postCreateSchema.parse(data)

    // Create post with categories if provided
    const post = await prisma.post.create({
      data: {
        title: validatedData.title,
        content: validatedData.content,
        published: validatedData.published,
        author: {
          connect: { id: session.user.id },
        },
        ...(validatedData.categoryIds && validatedData.categoryIds.length > 0
          ? {
              categories: {
                connect: validatedData.categoryIds.map((id) => ({ id })),
              },
            }
          : {}),
      },
      include: {
        author: {
          select: {
            username: true,
          },
        },
        categories: true,
      },
    })

    // Revalidate posts page to reflect the new post
    revalidatePath('/posts')

    return { post }
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.error('Validation error creating post', { issues: error.issues })
      throw new AppError({
        code: 'VALIDATION_ERROR',
        message: error.issues[0].message,
        statusCode: 400,
      })
    }

    if (error instanceof AppError) {
      throw error
    }

    logger.error('Failed to create post', { error })
    throw new AppError({
      code: 'CREATE_FAILED',
      message: 'Failed to create post',
      statusCode: 500,
    })
  }
}

/**
 * Update an existing post
 */
export async function updatePost(data: z.infer<typeof postUpdateSchema>) {
  try {
    // Get current user session
    const session = await getServerSession()

    if (!session?.user) {
      throw new AppError({
        code: 'UNAUTHORIZED',
        message: 'You must be logged in to update a post',
        statusCode: 401,
      })
    }

    // Validate input
    const validatedData = postUpdateSchema.parse(data)

    // Check if post exists and user is author or admin
    const existingPost = await prisma.post.findUnique({
      where: { id: validatedData.id },
      select: { authorId: true },
    })

    if (!existingPost) {
      throw new AppError({
        code: 'NOT_FOUND',
        message: 'Post not found',
        statusCode: 404,
      })
    }

    // Check if user is author or admin
    const isAuthor = existingPost.authorId === session.user.id
    const isAdmin = session.user.role === 'ADMIN'

    if (!isAuthor && !isAdmin) {
      throw new AppError({
        code: 'FORBIDDEN',
        message: 'You do not have permission to update this post',
        statusCode: 403,
      })
    }

    // Update post
    const updateData: any = {}

    if (validatedData.title !== undefined)
      updateData.title = validatedData.title
    if (validatedData.content !== undefined)
      updateData.content = validatedData.content
    if (validatedData.published !== undefined)
      updateData.published = validatedData.published

    // Handle category updates if provided
    const categoryConnections = validatedData.categoryIds
      ? {
          categories: {
            set: [], // Clear existing connections
            connect: validatedData.categoryIds.map((id) => ({ id })),
          },
        }
      : {}

    const post = await prisma.post.update({
      where: { id: validatedData.id },
      data: {
        ...updateData,
        ...categoryConnections,
      },
      include: {
        categories: true,
      },
    })

    // Revalidate post page to reflect changes
    revalidatePath(`/posts/${post.id}`)
    revalidatePath('/posts')

    return { post }
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.error('Validation error updating post', { issues: error.issues })
      throw new AppError({
        code: 'VALIDATION_ERROR',
        message: error.issues[0].message,
        statusCode: 400,
      })
    }

    if (error instanceof AppError) {
      throw error
    }

    logger.error('Failed to update post', { error })
    throw new AppError({
      code: 'UPDATE_FAILED',
      message: 'Failed to update post',
      statusCode: 500,
    })
  }
}

/**
 * Delete a post
 */
export async function deletePost(id: string) {
  try {
    // Get current user session
    const session = await getServerSession()

    if (!session?.user) {
      throw new AppError({
        code: 'UNAUTHORIZED',
        message: 'You must be logged in to delete a post',
        statusCode: 401,
      })
    }

    // Check if post exists and user is author or admin
    const existingPost = await prisma.post.findUnique({
      where: { id },
      select: { authorId: true },
    })

    if (!existingPost) {
      throw new AppError({
        code: 'NOT_FOUND',
        message: 'Post not found',
        statusCode: 404,
      })
    }

    // Check if user is author or admin
    const isAuthor = existingPost.authorId === session.user.id
    const isAdmin = session.user.role === 'ADMIN'

    if (!isAuthor && !isAdmin) {
      throw new AppError({
        code: 'FORBIDDEN',
        message: 'You do not have permission to delete this post',
        statusCode: 403,
      })
    }

    // Delete post
    await prisma.post.delete({
      where: { id },
    })

    // Revalidate posts page to reflect deletion
    revalidatePath('/posts')

    return { success: true }
  } catch (error) {
    if (error instanceof AppError) {
      throw error
    }

    logger.error('Failed to delete post', { error, postId: id })
    throw new AppError({
      code: 'DELETE_FAILED',
      message: 'Failed to delete post',
      statusCode: 500,
    })
  }
}

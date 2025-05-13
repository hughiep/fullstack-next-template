'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { getServerSession } from '@/modules/core/auth/services'
import { prisma } from '@/shared/lib/prisma'
import { AppError } from '@/shared/types/error'

// Validation schema
const profileSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  bio: z.string().optional(),
  location: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  avatarUrl: z.string().url().optional().or(z.literal('')),
})

export async function updateProfile(formData: {
  username: string
  bio: string
  location: string
  website: string
  avatarUrl: string
}) {
  // Get current user session
  const session = await getServerSession()

  if (!session?.user) {
    throw new AppError('You must be logged in to update your profile', {
      code: 'UNAUTHORIZED',
      statusCode: 401,
    })
  }

  // Validate the form data
  try {
    const validatedData = profileSchema.parse(formData)

    // Update user's username
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        username: validatedData.username,
      },
    })

    // Update or create profile
    await prisma.profile.upsert({
      where: { userId: session.user.id },
      update: {
        bio: validatedData.bio || null,
        location: validatedData.location || null,
        website: validatedData.website || null,
        avatarUrl: validatedData.avatarUrl || null,
      },
      create: {
        userId: session.user.id,
        bio: validatedData.bio || null,
        location: validatedData.location || null,
        website: validatedData.website || null,
        avatarUrl: validatedData.avatarUrl || null,
      },
    })

    // Revalidate the profile page
    revalidatePath('/profile')

    return { success: true }
  } catch (error) {
    console.error('Profile update error:', error)

    // Handle validation errors
    if (error instanceof z.ZodError) {
      const firstIssue = error.issues[0]
      throw new Error(firstIssue.message)
    }

    // Handle other errors
    throw new Error('Failed to update profile')
  }
}

'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

// This would be in a comments service module
async function addComment(postId: string, content: string) {
  'use server'

  const { getServerSession } = await import('@/modules/auth/services')
  const { prisma } = await import('@/shared/lib/prisma')
  const { AppError } = await import('@/shared/types/error')

  // Check authentication
  const session = await getServerSession()
  if (!session?.user) {
    throw new AppError({
      code: 'UNAUTHORIZED',
      message: 'You must be logged in to comment',
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

type CommentType = {
  id: string
  content: string
  createdAt: string
  author: {
    id: string
    username: string
    profile?: {
      avatarUrl?: string
    }
  }
}

export default function CommentSection({
  postId,
  initialComments,
}: {
  postId: string
  initialComments: CommentType[]
}) {
  const [comments, setComments] = useState<CommentType[]>(initialComments)
  const [content, setContent] = useState('')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!content.trim()) {
      setError('Comment cannot be empty')
      return
    }

    startTransition(async () => {
      try {
        const newComment = await addComment(postId, content)
        setComments((prev) => [newComment, ...prev])
        setContent('')
        router.refresh() // Update any cached data
      } catch (err: any) {
        setError(err.message || 'Failed to add comment')
      }
    })
  }

  return (
    <div className="mt-8">
      <h2 className="mb-4 text-2xl font-bold">Comments ({comments.length})</h2>

      <form onSubmit={handleSubmit} className="mb-6">
        <div className="mb-3">
          <label
            htmlFor="comment"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Add a comment
          </label>
          <textarea
            id="comment"
            rows={3}
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your comment here..."
            disabled={isPending}
          />
        </div>

        {error && <div className="mb-3 text-sm text-red-600">{error}</div>}

        <button
          type="submit"
          disabled={isPending}
          className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {isPending ? 'Posting...' : 'Post Comment'}
        </button>
      </form>

      <div className="space-y-6">
        {comments.length === 0 ? (
          <p className="py-4 text-center text-gray-600">
            No comments yet. Be the first to comment!
          </p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="border-b border-gray-200 pb-4">
              <div className="mb-2 flex items-center">
                <div className="flex items-center">
                  {comment.author.profile?.avatarUrl ? (
                    <img
                      src={comment.author.profile.avatarUrl}
                      alt={comment.author.username}
                      className="mr-2 h-6 w-6 rounded-full"
                    />
                  ) : (
                    <div className="mr-2 h-6 w-6 rounded-full bg-gray-200" />
                  )}
                  <span className="font-semibold">
                    {comment.author.username}
                  </span>
                </div>
                <span className="mx-2 text-gray-400">•</span>
                <span className="text-sm text-gray-500">
                  {new Date(comment.createdAt).toLocaleString()}
                </span>
              </div>
              <p className="whitespace-pre-wrap">{comment.content}</p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

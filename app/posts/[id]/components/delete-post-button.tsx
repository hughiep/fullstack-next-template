'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

import { deletePost } from '@/modules/features/posts/services'

export default function DeletePostButton({ postId }: { postId: string }) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    try {
      setIsDeleting(true)
      await deletePost(postId)
      router.push('/posts')
      router.refresh()
    } catch (error) {
      console.error('Failed to delete post:', error)
      setIsDeleting(false)
      setShowConfirm(false)
    }
  }

  if (showConfirm) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-red-600">Are you sure?</span>
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="rounded bg-red-600 px-2 py-1 text-sm text-white hover:bg-red-700 disabled:opacity-50"
        >
          {isDeleting ? 'Deleting...' : 'Yes, delete'}
        </button>
        <button
          onClick={() => setShowConfirm(false)}
          disabled={isDeleting}
          className="rounded bg-gray-100 px-2 py-1 text-sm text-gray-600 hover:bg-gray-200 disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setShowConfirm(true)}
      className="text-red-600 hover:underline"
    >
      Delete post
    </button>
  )
}

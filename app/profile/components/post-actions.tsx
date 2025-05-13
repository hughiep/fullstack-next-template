'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'

import {
  publishPost as publishPostAction,
  unpublishPost as unpublishPostAction,
} from '@/modules/features/posts/actions'

export default function PostActions({
  postId,
  isPublished,
}: {
  postId: string
  isPublished: boolean
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handlePublish = () => {
    startTransition(async () => {
      try {
        await publishPostAction(postId)
        router.refresh()
      } catch (error) {
        console.error('Failed to publish post:', error)
        // You could add toast notifications here
      }
    })
  }

  const handleUnpublish = () => {
    startTransition(async () => {
      try {
        await unpublishPostAction(postId)
        router.refresh()
      } catch (error) {
        console.error('Failed to unpublish post:', error)
        // You could add toast notifications here
      }
    })
  }

  return (
    <div className="flex justify-end space-x-2">
      {!isPublished ? (
        <button
          onClick={handlePublish}
          disabled={isPending}
          className="rounded bg-blue-100 px-2 py-1 text-xs text-blue-800 hover:bg-blue-200 disabled:opacity-50"
        >
          {isPending ? 'Publishing...' : 'Publish'}
        </button>
      ) : (
        <button
          onClick={handleUnpublish}
          disabled={isPending}
          className="rounded bg-amber-100 px-2 py-1 text-xs text-amber-800 hover:bg-amber-200 disabled:opacity-50"
        >
          {isPending ? 'Unpublishing...' : 'Unpublish'}
        </button>
      )}
    </div>
  )
}

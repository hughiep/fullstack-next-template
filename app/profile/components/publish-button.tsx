'use client'

import { publishPost, unpublishPost } from '@/modules/features/posts/actions'

export default function PublishButton({ post }: any) {
  return !post.published ? (
    <button
      onClick={() => publishPost(post.id)}
      className="rounded bg-blue-100 px-2 py-1 text-xs text-blue-800 hover:bg-blue-200"
    >
      Publish
    </button>
  ) : (
    <button
      onClick={() => unpublishPost(post.id)}
      className="rounded bg-amber-100 px-2 py-1 text-xs text-amber-800 hover:bg-amber-200"
    >
      Unpublish
    </button>
  )
}

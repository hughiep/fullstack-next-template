import Link from 'next/link'
import { Suspense } from 'react'

import { getPublishedPosts } from '@/modules/features/posts/services'

// Pagination component
function Pagination({
  currentPage,
  totalPages,
}: {
  currentPage: number
  totalPages: number
}) {
  return (
    <div className="mt-8 flex justify-center gap-2">
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
        <Link
          key={page}
          href={`/posts?page=${page}`}
          className={`rounded px-4 py-2 ${
            page === currentPage
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 hover:bg-gray-300'
          }`}
        >
          {page}
        </Link>
      ))}
    </div>
  )
}

// Post card component
function PostCard({ post }: { post: any }) {
  return (
    <div className="rounded-lg border border-gray-200 p-6 transition-shadow hover:shadow-md">
      <h2 className="mb-2 text-2xl font-bold">
        <Link href={`/posts/${post.id}`} className="hover:text-blue-600">
          {post.title}
        </Link>
      </h2>
      <div className="mb-4 flex items-center text-sm text-gray-600">
        <span>By {post.author.username}</span>
        <span className="mx-2">•</span>
        <span>{new Date(post.createdAt).toLocaleDateString()}</span>
        <span className="mx-2">•</span>
        <span>{post._count.comments} comments</span>
      </div>
      <p className="mb-4 text-gray-700">
        {post.content.length > 150
          ? `${post.content.substring(0, 150)}...`
          : post.content}
      </p>
      <div className="flex flex-wrap gap-2">
        {post.categories.map((category: any) => (
          <span
            key={category.id}
            className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-800"
          >
            {category.name}
          </span>
        ))}
      </div>
    </div>
  )
}

// Posts list with suspense
async function PostsList({ page }: { page: number }) {
  // Using Server Action for data fetching
  const { posts, pagination } = await getPublishedPosts({ page, limit: 10 })

  if (posts.length === 0) {
    return <p className="py-10 text-center text-gray-600">No posts found</p>
  }

  return (
    <div>
      <div className="grid gap-6 md:grid-cols-2">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>

      <Pagination
        currentPage={pagination.page}
        totalPages={pagination.totalPages}
      />
    </div>
  )
}

// Posts page component
export default async function PostsPage({
  searchParams,
}: {
  searchParams: { page?: string }
}) {
  const page = searchParams.page ? parseInt(searchParams.page) : 1

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-10 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Latest Posts</h1>
        <Link
          href="/posts/new"
          className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Create Post
        </Link>
      </div>

      <Suspense
        fallback={<div className="py-10 text-center">Loading posts...</div>}
      >
        <PostsList page={page} />
      </Suspense>
    </div>
  )
}

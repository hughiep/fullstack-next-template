import Link from 'next/link'
import { notFound } from 'next/navigation'

import { getPostById, deletePost } from '@/modules/features/posts/services'
import { getServerSession } from '@/modules/core/auth/services'

import DeletePostButton from './components/delete-post-button'
import CommentSection from './components/comment-section'

export default async function PostPage({ params }: { params: { id: string } }) {
  try {
    // Using Server Action to fetch post data
    const { post } = await getPostById(params.id)
    const session = await getServerSession()

    const isAuthor = session?.user?.id === post.author.id
    const isAdmin = session?.user?.role === 'ADMIN'
    const canEdit = isAuthor || isAdmin

    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-6">
          <Link href="/posts" className="text-blue-600 hover:underline">
            ← Back to posts
          </Link>
        </div>

        <article className="prose lg:prose-xl max-w-none">
          <header className="mb-8">
            <h1 className="mb-3 text-3xl font-bold">{post.title}</h1>

            <div className="mb-4 flex items-center text-gray-600">
              <div className="flex items-center">
                {post.author.profile?.avatarUrl ? (
                  <img
                    src={post.author.profile.avatarUrl}
                    alt={post.author.username}
                    className="mr-2 h-8 w-8 rounded-full"
                  />
                ) : (
                  <div className="mr-2 h-8 w-8 rounded-full bg-gray-200" />
                )}
                <span>By {post.author.username}</span>
              </div>
              <span className="mx-2">•</span>
              <span>{new Date(post.createdAt).toLocaleDateString()}</span>
            </div>

            {canEdit && (
              <div className="mb-4 flex gap-3">
                <Link
                  href={`/posts/${post.id}/edit`}
                  className="text-blue-600 hover:underline"
                >
                  Edit post
                </Link>

                <DeletePostButton postId={post.id} />
              </div>
            )}

            <div className="mb-4 flex flex-wrap gap-2">
              {post.categories.map((category: any) => (
                <span
                  key={category.id}
                  className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-800"
                >
                  {category.name}
                </span>
              ))}
            </div>
          </header>

          <div className="whitespace-pre-wrap">{post.content}</div>
        </article>

        <hr className="my-10" />

        <CommentSection postId={post.id} initialComments={post.comments} />
      </div>
    )
  } catch (error) {
    // If post doesn't exist, show 404 page
    return notFound()
  }
}

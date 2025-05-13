import { redirect } from 'next/navigation'
import Link from 'next/link'

import { getServerSession } from '@/modules/core/auth/services'
import { prisma } from '@/shared/lib/prisma'

import ProfileForm from './components/profile-form'
import UserInfo from './components/user-info'
import PublishButton from './components/publish-button'

export default async function ProfilePage() {
  // Get current user session
  const session = await getServerSession()

  if (!session?.user) {
    redirect('/login')
  }

  // Get detailed user data including profile
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      profile: true,
      posts: {
        select: {
          id: true,
          title: true,
          createdAt: true,
          published: true,
          _count: {
            select: {
              comments: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 5,
      },
    },
  })

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold">Your Profile</h1>

      <div className="grid gap-8 md:grid-cols-3">
        {/* User information card */}
        <div className="md:col-span-1">
          <UserInfo user={user} />
        </div>

        {/* Profile edit form */}
        <div className="md:col-span-2">
          <ProfileForm user={user} />
        </div>
      </div>

      {/* Posts management */}
      <div className="mt-12">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold">Your Posts</h2>
          <Link
            href="/posts/new"
            className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Create New Post
          </Link>
        </div>

        {user.posts.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center">
            <p className="mb-4 text-gray-600">
              You haven't created any posts yet.
            </p>
            <Link href="/posts/new" className="text-blue-600 hover:underline">
              Create your first post →
            </Link>
          </div>
        ) : (
          <div className="rounded-lg border bg-white">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                    Title
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
                    Date
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-medium text-gray-500">
                    Status
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-medium text-gray-500">
                    Comments
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-medium text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {user.posts.map((post) => (
                  <tr key={post.id}>
                    <td className="px-6 py-4">
                      <Link
                        href={`/posts/${post.id}`}
                        className="font-medium text-blue-600 hover:underline"
                      >
                        {post.title}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-500">
                      {new Date(post.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {post.published ? (
                        <span className="inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-800">
                          Published
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-800">
                          Draft
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-gray-500">
                      {post._count.comments}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end space-x-2">
                        <Link
                          href={`/posts/edit/${post.id}`}
                          className="rounded bg-gray-100 px-2 py-1 text-xs hover:bg-gray-200"
                        >
                          Edit
                        </Link>
                        <PublishButton post={post} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

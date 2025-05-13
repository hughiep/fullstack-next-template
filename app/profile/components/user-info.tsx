'use client'

import Image from 'next/image'
import { User } from '@prisma/client'

type UserWithProfile = User & {
  profile: {
    bio: string | null
    avatarUrl: string | null
    location: string | null
    website: string | null
  } | null
}

export default function UserInfo({ user }: { user: UserWithProfile }) {
  return (
    <div className="rounded-lg border bg-white p-6 shadow-sm">
      <div className="flex flex-col items-center">
        <div className="relative mb-4 h-24 w-24">
          {user.profile?.avatarUrl ? (
            <Image
              src={user.profile.avatarUrl}
              alt={user.username}
              className="h-24 w-24 rounded-full object-cover"
              width={96}
              height={96}
            />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gray-200 text-2xl font-bold text-gray-600">
              {user.username.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        <h2 className="mb-1 text-xl font-bold">{user.username}</h2>
        <p className="mb-4 text-gray-600">{user.email}</p>

        {user.profile?.bio && (
          <div className="mb-4 w-full">
            <p className="text-center text-gray-700">{user.profile.bio}</p>
          </div>
        )}

        <div className="mt-2 w-full space-y-1 text-sm">
          {user.profile?.location && (
            <div className="flex items-center justify-center gap-1">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 text-gray-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <span>{user.profile.location}</span>
            </div>
          )}

          {user.profile?.website && (
            <div className="flex items-center justify-center gap-1">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 text-gray-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h.5A2.5 2.5 0 0020 5.5v-.565M8 3.935l6-1.4 6 1.4"
                />
              </svg>
              <a
                href={user.profile.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                {user.profile.website.replace(/^https?:\/\//, '')}
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

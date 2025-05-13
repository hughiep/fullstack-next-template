'use client'

import { useState } from 'react'
import { User } from '@prisma/client'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

import { updateProfile } from '../actions/profile-actions'

type UserWithProfile = User & {
  profile: {
    bio: string | null
    avatarUrl: string | null
    location: string | null
    website: string | null
  } | null
}

export default function ProfileForm({ user }: { user: UserWithProfile }) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    username: user.username,
    bio: user.profile?.bio || '',
    location: user.profile?.location || '',
    website: user.profile?.website || '',
    avatarUrl: user.profile?.avatarUrl || '',
  })

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      await updateProfile(formData)
      setSuccess('Profile updated successfully')
      router.refresh() // Refresh the page to show updated data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="rounded-lg border bg-white p-6 shadow-sm">
      <h2 className="mb-6 text-xl font-semibold">Edit Profile</h2>

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label
            htmlFor="username"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Username
          </label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            required
          />
        </div>

        <div className="mb-4">
          <label
            htmlFor="avatarUrl"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Avatar URL
          </label>
          <input
            type="url"
            id="avatarUrl"
            name="avatarUrl"
            value={formData.avatarUrl}
            onChange={handleChange}
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          />
          {formData.avatarUrl && (
            <div className="mt-2 flex items-center">
              <div className="relative h-12 w-12 overflow-hidden rounded-full">
                <Image
                  src={formData.avatarUrl}
                  alt="Avatar preview"
                  width={48}
                  height={48}
                  className="h-full w-full object-cover"
                />
              </div>
              <span className="ml-2 text-sm text-gray-500">Preview</span>
            </div>
          )}
        </div>

        <div className="mb-4">
          <label
            htmlFor="bio"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Bio
          </label>
          <textarea
            id="bio"
            name="bio"
            value={formData.bio}
            onChange={handleChange}
            rows={3}
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          ></textarea>
        </div>

        <div className="mb-4">
          <label
            htmlFor="location"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Location
          </label>
          <input
            type="text"
            id="location"
            name="location"
            value={formData.location}
            onChange={handleChange}
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <div className="mb-4">
          <label
            htmlFor="website"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Website
          </label>
          <input
            type="url"
            id="website"
            name="website"
            value={formData.website}
            onChange={handleChange}
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        {error && <div className="mb-4 text-sm text-red-600">{error}</div>}
        {success && (
          <div className="mb-4 text-sm text-green-600">{success}</div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isLoading}
            className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  )
}

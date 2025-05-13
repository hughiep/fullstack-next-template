'use client'

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react'
import { useRouter } from 'next/navigation'

// Import auth services
import { getServerSession, signOut } from '@/modules/core/auth/services'

// User type definition
type User = {
  id: string
  email: string
  username: string
  role: string
  profile?: {
    avatarUrl?: string | null
  } | null
}

// Auth context state
type AuthContextType = {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

// Create context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  logout: async () => {},
  refreshUser: async () => {},
})

// Custom hook to use auth context
export const useAuth = () => useContext(AuthContext)

// Auth provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  // Function to fetch current user
  const refreshUser = async () => {
    try {
      setIsLoading(true)
      // Using server action to get session
      const session = await getServerSession()
      console.log('Session:', session)
      setUser(session?.user || null)
    } catch (error) {
      console.error('Failed to refresh user:', error)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  // Function to handle logout
  const logout = async () => {
    try {
      await signOut()
      setUser(null)
      router.push('/')
      router.refresh()
    } catch (error) {
      console.error('Failed to logout:', error)
    }
  }

  // Fetch user on initial render
  useEffect(() => {
    refreshUser()
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { AuthUser, AuthService } from '@/lib/auth'
import { User } from '@/lib/database.types'

interface AuthContextType {
  user: AuthUser | null
  userDetails: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  refreshUserDetails: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [userDetails, setUserDetails] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is logged in on mount
    const storedUser = localStorage.getItem('auth_user')
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser)
        setUser(parsedUser)
        refreshUserDetails(parsedUser.id)
      } catch (error) {
        console.error('Error parsing stored user:', error)
        localStorage.removeItem('auth_user')
      }
    }
    setLoading(false)
  }, [])

  const refreshUserDetails = async (userId?: string) => {
    const targetUserId = userId || user?.id
    if (!targetUserId) return

    try {
      const details = await AuthService.getUserById(targetUserId)
      setUserDetails(details)
    } catch (error) {
      console.error('Error refreshing user details:', error)
    }
  }

  const login = async (email: string, password: string): Promise<boolean> => {
    setLoading(true)
    try {
      const authUser = await AuthService.login({ email, password })
      if (authUser) {
        setUser(authUser)
        localStorage.setItem('auth_user', JSON.stringify(authUser))
        await refreshUserDetails(authUser.id)
        return true
      }
      return false
    } catch (error) {
      console.error('Login error:', error)
      return false
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    setUser(null)
    setUserDetails(null)
    localStorage.removeItem('auth_user')
  }

  const value: AuthContextType = {
    user,
    userDetails,
    loading,
    login,
    logout,
    refreshUserDetails
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

import bcrypt from 'bcryptjs'
import { supabase } from './supabase'
import { User } from './database.types'

export interface LoginCredentials {
  email: string
  password: string
}

export interface AuthUser {
  id: string
  email: string
  name: string
  role: 'borrower' | 'lender'
}

export class AuthService {
  static async login(credentials: LoginCredentials): Promise<AuthUser | null> {
    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', credentials.email)
        .returns<User>()
        .single()

      if (error || !user) {
        return null
      }

      const isValidPassword = await bcrypt.compare(credentials.password, user.password_hash)
      
      if (!isValidPassword) {
        return null
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    } catch (error) {
      console.error('Login error:', error)
      return null
    }
  }

  static async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<boolean> {
    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('password_hash')
        .eq('id', userId)
        .returns<{ password_hash: string }>()
        .single()

      if (error || !user) {
        return false
      }

      const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash)
      
      if (!isValidPassword) {
        return false
      }

      const saltRounds = 12
      const newPasswordHash = await bcrypt.hash(newPassword, saltRounds)

      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          password_hash: newPasswordHash,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      return !updateError
    } catch (error) {
      console.error('Change password error:', error)
      return false
    }
  }

  static async getUserById(userId: string): Promise<User | null> {
    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .returns<User>()
        .single()

      return error || !user ? null : user
    } catch (error) {
      console.error('Get user error:', error)
      return null
    }
  }
}

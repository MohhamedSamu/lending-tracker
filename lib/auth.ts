import bcrypt from 'bcryptjs'
import { supabase } from './supabase'
import { User, Database } from './database.types'

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
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', credentials.email)
        .single()

      if (error || !data) {
        return null
      }

      const user = data as User
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
      const { data, error } = await supabase
        .from('users')
        .select('password_hash')
        .eq('id', userId)
        .single()

      if (error || !data) {
        return false
      }

      const user = data as { password_hash: string }
      const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash)
      
      if (!isValidPassword) {
        return false
      }

      const saltRounds = 12
      const newPasswordHash = await bcrypt.hash(newPassword, saltRounds)

      const updates: Database['public']['Tables']['users']['Update'] = {
        password_hash: newPasswordHash,
        updated_at: new Date().toISOString()
      }

      const { error: updateError } = await (supabase
        .from('users') as any)
        .update(updates)
        .eq('id', userId)

      return !updateError
    } catch (error) {
      console.error('Change password error:', error)
      return false
    }
  }

  static async getUserById(userId: string): Promise<User | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (error || !data) {
        return null
      }

      return data as User
    } catch (error) {
      console.error('Get user error:', error)
      return null
    }
  }
}

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string
          role: 'borrower' | 'lender'
          password_hash: string
          loan_amount?: number
          monthly_payment?: number
          loan_start_date?: string
          loan_duration_months?: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          name: string
          role: 'borrower' | 'lender'
          password_hash: string
          loan_amount?: number
          monthly_payment?: number
          loan_start_date?: string
          loan_duration_months?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          role?: 'borrower' | 'lender'
          password_hash?: string
          loan_amount?: number
          monthly_payment?: number
          loan_start_date?: string
          loan_duration_months?: number
          created_at?: string
          updated_at?: string
        }
      }
      payments: {
        Row: {
          id: string
          user_id: string
          amount: number
          payment_date: string
          payment_type: 'minimum' | 'extra'
          voucher_url?: string
          notes?: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          amount: number
          payment_date: string
          payment_type?: 'minimum' | 'extra'
          voucher_url?: string
          notes?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          amount?: number
          payment_date?: string
          payment_type?: 'minimum' | 'extra'
          voucher_url?: string
          notes?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: 'borrower' | 'lender'
    }
  }
}

export type User = Database['public']['Tables']['users']['Row']
export type Payment = Database['public']['Tables']['payments']['Row']
export type NewUser = Database['public']['Tables']['users']['Insert']
export type NewPayment = Database['public']['Tables']['payments']['Insert']

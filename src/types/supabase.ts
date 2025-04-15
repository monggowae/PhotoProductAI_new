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
      profiles: {
        Row: {
          id: string
          name: string
          role: 'user' | 'admin'
          email: string
          api_tokens: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          name: string
          role?: 'user' | 'admin'
          email: string
          api_tokens?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          role?: 'user' | 'admin'
          email?: string
          api_tokens?: number
          created_at?: string
          updated_at?: string
        }
      }
      token_requests: {
        Row: {
          id: string
          user_id: string
          user_email: string
          amount: number
          status: 'pending' | 'approved' | 'rejected'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          user_email: string
          amount: number
          status?: 'pending' | 'approved' | 'rejected'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          user_email?: string
          amount?: number
          status?: 'pending' | 'approved' | 'rejected'
          created_at?: string
          updated_at?: string
        }
      }
    }
    Functions: {
      approve_token_request: {
        Args: {
          request_id: string
          token_amount: number
        }
        Returns: void
      }
    }
  }
}
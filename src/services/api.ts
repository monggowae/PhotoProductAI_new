import { supabase } from '../lib/supabase';
import { TokenRequest, TokenTransfer } from '../types/auth';

export const api = {
  auth: {
    login: async (email: string, password: string) => {
      return supabase.auth.signInWithPassword({ email, password });
    },
    signup: async (email: string, password: string, name: string) => {
      return supabase.auth.signUp({
        email,
        password,
        options: { data: { name } }
      });
    },
    logout: () => supabase.auth.signOut()
  },
  
  profile: {
    update: async (userId: string, data: { name: string }) => {
      return supabase
        .from('profiles')
        .update(data)
        .eq('id', userId);
    },
    updatePassword: async (newPassword: string) => {
      return supabase.auth.updateUser({ password: newPassword });
    }
  },

  tokens: {
    request: async (userId: string, amount: number) => {
      return supabase
        .from('token_requests')
        .insert({ user_id: userId, amount })
        .select()
        .single();
    },
    approve: async (requestId: string, amount: number) => {
      return supabase.rpc('approve_token_request', {
        request_id: requestId,
        token_amount: amount
      });
    },
    transfer: async (recipientEmail: string, amount: number) => {
      return supabase.rpc('transfer_tokens', {
        recipient_email: recipientEmail,
        transfer_amount: amount
      });
    }
  }
};
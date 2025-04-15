import { create } from 'zustand';
import { AuthState, User, TokenRequest, TokenTransfer } from '../types/auth';
import { supabase } from '../lib/supabase';

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  tokenRequests: [],
  tokenTransfers: [],
  
  login: async (email: string, password: string) => {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      throw new Error(authError.message);
    }

    if (!authData.user) {
      throw new Error('No user data returned');
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (profileError) {
      throw new Error('Failed to fetch user profile');
    }

    const user: User = {
      id: profile.id,
      email: profile.email,
      name: profile.name,
      phone: profile.phone,
      role: profile.role,
      apiTokens: profile.api_tokens,
    };

    // Fetch token requests based on user role
    let requests: any[] = [];
    let requestsError = null;

    if (user.role === 'admin') {
      const { data: adminRequests, error } = await supabase
        .from('token_requests')
        .select('*')
        .order('created_at', { ascending: false });

      requests = adminRequests || [];
      requestsError = error;
    } else {
      const { data: userRequests, error } = await supabase
        .from('token_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      requests = userRequests || [];
      requestsError = error;
    }

    // Fetch token transfers
    const { data: transfers, error: transfersError } = await supabase
      .from('token_transfers')
      .select('*')
      .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
      .order('created_at', { ascending: false });

    if (requestsError) {
      console.error('Failed to fetch token requests:', requestsError);
    }

    if (transfersError) {
      console.error('Failed to fetch token transfers:', transfersError);
    }

    const transformedRequests: TokenRequest[] = requests.map(request => ({
      id: request.id,
      userId: request.user_id,
      userEmail: request.user_email,
      amount: request.amount,
      status: request.status,
      createdAt: request.created_at
    }));

    const transformedTransfers: TokenTransfer[] = transfers ? transfers.map(transfer => ({
      id: transfer.id,
      senderId: transfer.sender_id,
      senderEmail: transfer.sender_email,
      recipientId: transfer.recipient_id,
      recipientEmail: transfer.recipient_email,
      amount: transfer.amount,
      createdAt: transfer.created_at
    })) : [];

    set({ 
      user, 
      isAuthenticated: true,
      tokenRequests: transformedRequests,
      tokenTransfers: transformedTransfers
    });
  },

  signup: async (email: string, password: string, name: string, phone: string) => {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          phone
        }
      }
    });

    if (authError) {
      throw new Error(authError.message);
    }

    if (!authData.user) {
      throw new Error('No user data returned');
    }

    // Since email confirmation is disabled, we can use the session immediately
    if (authData.session) {
      // Wait a brief moment for the trigger to create the profile
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Fetch the newly created profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (profileError) {
        throw new Error('Failed to fetch user profile');
      }

      const user: User = {
        id: profile.id,
        email: profile.email,
        name: profile.name,
        phone: profile.phone,
        role: profile.role,
        apiTokens: profile.api_tokens,
      };

      set({ 
        user,
        isAuthenticated: true,
        tokenRequests: [],
        tokenTransfers: []
      });
    }
  },

  logout: async () => {
    await supabase.auth.signOut();
    set({ user: null, isAuthenticated: false, tokenRequests: [], tokenTransfers: [] });
    window.location.href = '/'; // Redirect to landing page after logout
  },

  requestToken: async (amount: number) => {
    const { user } = get();
    if (!user) {
      throw new Error('User must be logged in to request tokens');
    }

    const { data: newRequest, error: insertError } = await supabase
      .from('token_requests')
      .insert({
        user_id: user.id,
        user_email: user.email,
        amount: amount,
        status: 'pending'
      })
      .select()
      .single();

    if (insertError || !newRequest) {
      throw new Error('Failed to create token request');
    }

    const { data: requests, error: fetchError } = await supabase
      .from('token_requests')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (fetchError) {
      throw new Error('Failed to fetch token requests');
    }

    const transformedRequests: TokenRequest[] = requests?.map(request => ({
      id: request.id,
      userId: request.user_id,
      userEmail: request.user_email,
      amount: request.amount,
      status: request.status,
      createdAt: request.created_at
    })) || [];

    set({ tokenRequests: transformedRequests });
  },

  updateTokenRequest: async (requestId: string, amount: number) => {
    const { error } = await supabase
      .from('token_requests')
      .update({ amount })
      .eq('id', requestId);

    if (error) {
      throw new Error('Failed to update token request');
    }

    const { user } = get();
    if (user?.role === 'admin') {
      const { data: requests } = await supabase
        .from('token_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (requests) {
        const transformedRequests: TokenRequest[] = requests.map(request => ({
          id: request.id,
          userId: request.user_id,
          userEmail: request.user_email,
          amount: request.amount,
          status: request.status,
          createdAt: request.created_at
        }));

        set({ tokenRequests: transformedRequests });
      }
    }
  },

  approveTokenRequest: async (requestId: string, amount: number) => {
    const { data: request, error: fetchError } = await supabase
      .from('token_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (fetchError || !request) {
      throw new Error('Failed to fetch token request');
    }

    const { error: rpcError } = await supabase.rpc('approve_token_request', {
      request_id: requestId,
      token_amount: amount,
    });

    if (rpcError) {
      throw new Error('Failed to approve token request');
    }

    const { user } = get();
    if (user && user.id === request.user_id) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (!profileError && profile) {
        set({
          user: {
            ...user,
            apiTokens: profile.api_tokens,
          },
        });
      }
    }

    if (user?.role === 'admin') {
      const { data: requests } = await supabase
        .from('token_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (requests) {
        const transformedRequests: TokenRequest[] = requests.map(request => ({
          id: request.id,
          userId: request.user_id,
          userEmail: request.user_email,
          amount: request.amount,
          status: request.status,
          createdAt: request.created_at
        }));

        set({ tokenRequests: transformedRequests });
      }
    }
  },

  rejectTokenRequest: async (requestId: string) => {
    const { error } = await supabase
      .from('token_requests')
      .update({ status: 'rejected' })
      .eq('id', requestId);

    if (error) {
      throw new Error('Failed to reject token request');
    }

    const { user } = get();
    if (user?.role === 'admin') {
      const { data: requests } = await supabase
        .from('token_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (requests) {
        const transformedRequests: TokenRequest[] = requests.map(request => ({
          id: request.id,
          userId: request.user_id,
          userEmail: request.user_email,
          amount: request.amount,
          status: request.status,
          createdAt: request.created_at
        }));

        set({ tokenRequests: transformedRequests });
      }
    }
  },

  transferTokens: async (recipientEmail: string, amount: number) => {
    const { error } = await supabase.rpc('transfer_tokens', {
      recipient_email: recipientEmail,
      transfer_amount: amount
    });

    if (error) {
      throw new Error(error.message);
    }

    const { user } = get();
    if (!user) return;

    // Refresh user data to get updated token balance
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      throw new Error('Failed to fetch updated profile');
    }

    // Fetch updated transfers
    const { data: transfers, error: transfersError } = await supabase
      .from('token_transfers')
      .select('*')
      .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
      .order('created_at', { ascending: false });

    if (transfersError) {
      throw new Error('Failed to fetch token transfers');
    }

    const transformedTransfers: TokenTransfer[] = transfers.map(transfer => ({
      id: transfer.id,
      senderId: transfer.sender_id,
      senderEmail: transfer.sender_email,
      recipientId: transfer.recipient_id,
      recipientEmail: transfer.recipient_email,
      amount: transfer.amount,
      createdAt: transfer.created_at
    }));

    set({
      user: {
        ...user,
        apiTokens: profile.api_tokens
      },
      tokenTransfers: transformedTransfers
    });
  }
}));
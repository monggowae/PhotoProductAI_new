import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import { RequestForm } from '../components/tokens/RequestForm';
import { RequestList } from '../components/tokens/RequestList';

export function TokenRequests() {
  const [minRequestAmount, setMinRequestAmount] = useState(100);
  const { user, requestToken, tokenRequests } = useAuthStore();

  useEffect(() => {
    fetchMinRequestAmount();
  }, []);

  const fetchMinRequestAmount = async () => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('int_value')
        .eq('key', 'minimum_token_request')
        .single();

      if (error) {
        console.error('Error fetching minimum token request:', error);
        return;
      }

      if (data?.int_value !== undefined) {
        setMinRequestAmount(data.int_value);
      }
    } catch (err) {
      console.error('Failed to fetch minimum token request:', err);
    }
  };

  if (!user) return null;

  const userRequests = tokenRequests.filter(request => request.userId === user.id);

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Token Requests</h1>
      <p className="text-gray-600 mb-8">Request more tokens from the admin</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <RequestForm
          minAmount={minRequestAmount}
          onSubmit={requestToken}
        />
        <RequestList requests={userRequests} />
      </div>
    </div>
  );
}
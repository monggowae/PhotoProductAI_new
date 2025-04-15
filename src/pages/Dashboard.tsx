import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import { TokenBalance } from '../components/TokenBalance';
import { TransferHistory } from '../components/TransferHistory';
import { RequestHistory } from '../components/RequestHistory';

export function Dashboard() {
  const user = useAuthStore((state) => state.user);
  const tokenRequests = useAuthStore((state) => state.tokenRequests);
  const tokenTransfers = useAuthStore((state) => state.tokenTransfers);
  const [tokenExpiryDays, setTokenExpiryDays] = useState<number | null>(null);

  useEffect(() => {
    fetchTokenExpiry();
  }, []);

  const fetchTokenExpiry = async () => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('int_value')
        .eq('key', 'token_expiration')
        .single();

      if (error) {
        console.error("Error fetching token expiration:", error);
        return;
      }

      if (data?.int_value !== undefined) {
        setTokenExpiryDays(data.int_value);
      }
    } catch (err) {
      console.error("Failed to fetch token expiration:", err);
    }
  };

  if (!user) return null;

  // Get only the user's requests and transfers
  const userRequests = tokenRequests.filter(request => request.userId === user.id);
  const userTransfers = tokenTransfers.filter(transfer => 
    transfer.senderId === user.id || transfer.recipientId === user.id
  );

  // Calculate expiration date
  const expiryDate = tokenExpiryDays 
    ? new Date(Date.now() + (tokenExpiryDays * 24 * 60 * 60 * 1000))
    : null;

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome, {user.email}
        </h1>
        <p className="text-gray-600 mt-2">
          Here's your token overview and account information
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <TokenBalance user={user} expiryDate={expiryDate} />
        <TransferHistory transfers={userTransfers} user={user} limit={6} />
        <RequestHistory requests={userRequests} limit={6} />
      </div>
    </div>
  );
}
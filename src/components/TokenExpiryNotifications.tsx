import React, { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ExpiryBreakdown {
  amount: number;
  expires_at: string;
}

interface TokenExpiryNotificationsProps {
  userId: string;
}

export function TokenExpiryNotifications({ userId }: TokenExpiryNotificationsProps) {
  const [expiryData, setExpiryData] = useState<ExpiryBreakdown[]>([]);

  useEffect(() => {
    fetchExpiryData();
  }, [userId]);

  const fetchExpiryData = async () => {
    try {
      const { data, error } = await supabase
        .from('user_token_expired_breakdown')
        .select('amount, expires_at')
        .eq('user_id', userId)
        .gt('expires_at', new Date().toISOString())
        .order('expires_at', { ascending: true });

      if (error) {
        console.error('Error fetching token expiry data:', error);
        return;
      }

      // Group by expiry date and sum amounts
      const groupedData = data.reduce((acc: ExpiryBreakdown[], curr) => {
        const existingEntry = acc.find(item => 
          new Date(item.expires_at).toDateString() === new Date(curr.expires_at).toDateString()
        );

        if (existingEntry) {
          existingEntry.amount += curr.amount;
        } else {
          acc.push({
            amount: curr.amount,
            expires_at: curr.expires_at
          });
        }

        return acc;
      }, []);

      setExpiryData(groupedData);
    } catch (err) {
      console.error('Failed to fetch token expiry data:', err);
    }
  };

  if (expiryData.length === 0) return null;

  return (
    <div className="mt-4 space-y-2">
      {expiryData.map((item, index) => (
        <div
          key={index}
          className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 rounded-lg px-3 py-2"
        >
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          <span>
            {item.amount} token akan hangus pada{' '}
            {new Date(item.expires_at).toLocaleDateString('id-ID', {
              timeZone: 'Asia/Jakarta',
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            })}
          </span>
        </div>
      ))}
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import { TransferForm } from '../components/tokens/TransferForm';
import { TransferList } from '../components/tokens/TransferList';

export function TransferTokens() {
  const [minBalance, setMinBalance] = useState(20);
  const [minTransferAmount, setMinTransferAmount] = useState(1);
  const { user, transferTokens, tokenTransfers } = useAuthStore();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('key, int_value')
        .in('key', ['minimum_balance', 'minimum_token_transfer']);

      if (error) {
        console.error("Error fetching settings:", error);
        return;
      }

      data.forEach(setting => {
        if (setting.key === 'minimum_balance' && setting.int_value !== undefined) {
          setMinBalance(setting.int_value);
        } else if (setting.key === 'minimum_token_transfer' && setting.int_value !== undefined) {
          setMinTransferAmount(setting.int_value);
        }
      });
    } catch (err) {
      console.error("Failed to fetch settings:", err);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Transfer Tokens</h1>
      <p className="text-gray-600 mb-8">Send tokens to other users</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <TransferForm
          minTransferAmount={minTransferAmount}
          minBalance={minBalance}
          availableTokens={user.apiTokens}
          onSubmit={transferTokens}
        />
        <TransferList
          transfers={tokenTransfers}
          currentUser={user}
        />
      </div>
    </div>
  );
}
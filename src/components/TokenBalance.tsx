import React from 'react';
import { Coins, Clock } from 'lucide-react';
import { TokenExpiryNotifications } from './TokenExpiryNotifications';
import { User } from '../types/auth';

interface TokenBalanceProps {
  user: User;
  expiryDate?: Date | null;
}

export function TokenBalance({ user, expiryDate }: TokenBalanceProps) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-2">Token Balance</h2>
      <p className="text-sm text-gray-600 mb-4">Your current token balance</p>
      <div className="flex items-center gap-3 mb-4">
        <Coins className="w-8 h-8 text-purple-600" />
        <span className="text-4xl font-bold text-gray-900">{user.apiTokens}</span>
      </div>
      {expiryDate && (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Clock className="w-4 h-4" />
          <span>
            Expires on: {expiryDate.toLocaleDateString('id-ID', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </span>
        </div>
      )}
      
      <TokenExpiryNotifications userId={user.id} />
    </div>
  );
}
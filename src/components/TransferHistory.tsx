import React from 'react';
import { ArrowRight } from 'lucide-react';
import { TokenTransfer, User } from '../types/auth';

interface TransferHistoryProps {
  transfers: TokenTransfer[];
  user: User;
  limit?: number;
}

export function TransferHistory({ transfers, user, limit }: TransferHistoryProps) {
  const displayTransfers = limit ? transfers.slice(0, limit) : transfers;

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Transfers</h2>
      <div className="space-y-3">
        {displayTransfers.length > 0 ? (
          displayTransfers.map((transfer) => (
            <div
              key={transfer.id}
              className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50"
            >
              <div className="flex items-center gap-2">
                {transfer.senderId === user.id ? (
                  <>
                    <span className="text-sm text-gray-600">To: {transfer.recipientEmail}</span>
                    <ArrowRight className="w-4 h-4 text-red-500" />
                  </>
                ) : (
                  <>
                    <span className="text-sm text-gray-600">From: {transfer.senderEmail}</span>
                    <ArrowRight className="w-4 h-4 text-green-500" />
                  </>
                )}
              </div>
              <span className={`text-sm font-medium ${
                transfer.senderId === user.id ? 'text-red-600' : 'text-green-600'
              }`}>
                {transfer.senderId === user.id ? '-' : '+'}{transfer.amount}
              </span>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-500 py-2">No transfer history</p>
        )}
      </div>
    </div>
  );
}
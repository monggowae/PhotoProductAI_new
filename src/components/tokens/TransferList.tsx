import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Card } from '../shared/Card';
import { TokenTransfer, User } from '../../types/auth';
import { TIME_ZONE } from '../../constants';

interface TransferListProps {
  transfers: TokenTransfer[];
  currentUser: User;
  title?: string;
}

export function TransferList({ transfers, currentUser, title = "Transfer History" }: TransferListProps) {
  return (
    <Card title={title}>
      <div className="space-y-4">
        {transfers.length > 0 ? (
          transfers.map((transfer) => (
            <div
              key={transfer.id}
              className="border-b border-gray-100 last:border-0 pb-4 last:pb-0"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {transfer.senderId === currentUser.id ? (
                    <>
                      <span className="text-gray-600">To: {transfer.recipientEmail}</span>
                      <ArrowRight className="w-4 h-4 text-red-500" />
                    </>
                  ) : (
                    <>
                      <span className="text-gray-600">From: {transfer.senderEmail}</span>
                      <ArrowRight className="w-4 h-4 text-green-500" />
                    </>
                  )}
                </div>
                <span className={`font-medium ${
                  transfer.senderId === currentUser.id ? 'text-red-600' : 'text-green-600'
                }`}>
                  {transfer.senderId === currentUser.id ? '-' : '+'}{transfer.amount} tokens
                </span>
              </div>
              <div className="mt-1 text-sm text-gray-500">
                {new Intl.DateTimeFormat('id-ID', {
                  timeZone: TIME_ZONE,
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false
                }).format(new Date(transfer.createdAt))}
              </div>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-500 py-4">No transfer history found.</p>
        )}
      </div>
    </Card>
  );
}
import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Card } from '../shared/Card';
import { StatusBadge } from '../shared/StatusBadge';
import { TokenRequest } from '../../types/auth';
import { TIME_ZONE } from '../../constants';

interface RequestListProps {
  requests: TokenRequest[];
  title?: string;
}

export function RequestList({ requests, title = "Request History" }: RequestListProps) {
  return (
    <Card title={title}>
      {requests.length === 0 ? (
        <p className="text-center text-gray-500 py-8">
          You haven't made any token requests yet.
        </p>
      ) : (
        <div className="space-y-4">
          {requests.map(request => (
            <div
              key={request.id}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{request.amount} tokens</span>
                  <ArrowRight className="w-4 h-4 text-gray-400" />
                  <StatusBadge status={request.status} />
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {new Intl.DateTimeFormat('id-ID', {
                    timeZone: TIME_ZONE,
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                  }).format(new Date(request.createdAt))}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
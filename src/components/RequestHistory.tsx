import React from 'react';
import { TokenRequest } from '../types/auth';

interface RequestHistoryProps {
  requests: TokenRequest[];
  limit?: number;
}

export function RequestHistory({ requests, limit }: RequestHistoryProps) {
  const displayRequests = limit ? requests.slice(0, limit) : requests;

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Requests</h2>
      <div className="space-y-3">
        {displayRequests.length > 0 ? (
          displayRequests.map((request) => (
            <div
              key={request.id}
              className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50"
            >
              <span className="text-sm text-gray-600">{request.amount} tokens</span>
              <span className={`
                px-2 py-1 rounded-full text-xs font-medium
                ${request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : ''}
                ${request.status === 'approved' ? 'bg-green-100 text-green-800' : ''}
                ${request.status === 'rejected' ? 'bg-red-100 text-red-800' : ''}
              `}>
                {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
              </span>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-500 py-2">No request history</p>
        )}
      </div>
    </div>
  );
}
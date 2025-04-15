import React, { useState } from 'react';
import { Edit2, Save, X, Check } from 'lucide-react';
import { TokenRequest } from '../../types/auth';
import { supabase } from '../../lib/supabase';

interface RequestsTableProps {
  requests: TokenRequest[];
  onApprove: (requestId: string, amount: number) => Promise<void>;
  onReject: (requestId: string) => Promise<void>;
  onUpdateAmount: (requestId: string, amount: number) => Promise<void>;
  loading: boolean;
}

export function RequestsTable({ 
  requests, 
  onApprove, 
  onReject, 
  onUpdateAmount,
  loading 
}: RequestsTableProps) {
  const [editingRequest, setEditingRequest] = useState<{ id: string; amount: number } | null>(null);
  const timeZone = 'Asia/Jakarta';

  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat('id-ID', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZoneName: 'short'
    }).format(new Date(date));
  };

  const handleSaveAmount = async (requestId: string, amount: number) => {
    try {
      await onUpdateAmount(requestId, amount);
      setEditingRequest(null);
    } catch (err) {
      console.error('Failed to update amount:', err);
    }
  };

  const handleApprove = async (requestId: string, amount: number) => {
    try {
      const request = requests.find(r => r.id === requestId);
      if (!request) return;

      // Get user's phone number
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('phone, name')
        .eq('id', request.userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching user profile:', error);
      }

      // Only attempt to send notification if profile exists and has a phone number
      if (profile?.phone) {
        try {
          await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-whatsapp`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              phone: profile.phone,
              message: `Hi, ${profile.name}.\n\nYour Request Accepted!\n\nToken Amount : ${amount}\n\nStatus : Paid\n\nPlease login to your member area & check your dashboard`,
              apiKey: 'b948bcee-12f1-4774-83fe-0573e3af247a'
            })
          });
        } catch (notificationError) {
          console.error('Failed to send notification:', notificationError);
          // Continue with approval even if notification fails
        }
      }

      await onApprove(requestId, amount);
    } catch (err) {
      console.error('Failed to approve request:', err);
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      const request = requests.find(r => r.id === requestId);
      if (!request) return;

      // Get user's phone number
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('phone, name')
        .eq('id', request.userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching user profile:', error);
      }

      // Only attempt to send notification if profile exists and has a phone number
      if (profile?.phone) {
        try {
          await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-whatsapp`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              phone: profile.phone,
              message: `Hi, ${profile.name}.\n\nYour Request Rejected!\n\nToken Amount : ${request.amount}\n\nStatus : Rejected.\n\nPlease contact admin for confirmation.`,
              apiKey: 'b948bcee-12f1-4774-83fe-0573e3af247a'
            })
          });
        } catch (notificationError) {
          console.error('Failed to send notification:', notificationError);
          // Continue with rejection even if notification fails
        }
      }

      await onReject(requestId);
    } catch (err) {
      console.error('Failed to reject request:', err);
    }
  };

  return (
    <table className="w-full">
      <thead>
        <tr className="text-left border-b border-gray-200">
          <th className="pb-3 font-medium text-gray-600">User</th>
          <th className="pb-3 font-medium text-gray-600">Email</th>
          <th className="pb-3 font-medium text-gray-600">Amount</th>
          <th className="pb-3 font-medium text-gray-600">Status</th>
          <th className="pb-3 font-medium text-gray-600">Date</th>
          <th className="pb-3 font-medium text-gray-600">Actions</th>
        </tr>
      </thead>
      <tbody>
        {requests.map(request => (
          <tr key={request.id} className="border-b border-gray-100">
            <td className="py-4">{request.name || request.userId}</td>
            <td className="py-4">{request.userEmail}</td>
            <td className="py-4">
              {editingRequest?.id === request.id ? (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={editingRequest.amount}
                    onChange={(e) => setEditingRequest({
                      ...editingRequest,
                      amount: parseInt(e.target.value) || 0
                    })}
                    className="w-20 rounded border border-gray-300 px-2 py-1"
                    min="1"
                  />
                  <button
                    onClick={() => handleSaveAmount(request.id, editingRequest.amount)}
                    disabled={loading}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <Save className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setEditingRequest(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  {request.amount}
                  {request.status === 'pending' && (
                    <button
                      onClick={() => setEditingRequest({
                        id: request.id,
                        amount: request.amount
                      })}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}
            </td>
            <td className="py-4">
              <span className={`
                px-2 py-1 rounded-full text-xs font-medium
                ${request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : ''}
                ${request.status === 'approved' ? 'bg-green-100 text-green-800' : ''}
                ${request.status === 'rejected' ? 'bg-red-100 text-red-800' : ''}
              `}>
                {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
              </span>
            </td>
            <td className="py-4">{formatDate(request.createdAt)}</td>
            <td className="py-4">
              {request.status === 'pending' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleApprove(
                      request.id,
                      editingRequest?.id === request.id
                        ? editingRequest.amount
                        : request.amount
                    )}
                    disabled={loading}
                    className="text-green-600 hover:text-green-800"
                  >
                    <Check className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleReject(request.id)}
                    disabled={loading}
                    className="text-red-600 hover:text-red-800"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
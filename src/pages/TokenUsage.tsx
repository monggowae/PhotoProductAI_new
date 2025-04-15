import React, { useState, useEffect } from 'react';
import { Database, Clock, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { TIME_ZONE } from '../constants';

interface TokenUsage {
  id: string;
  service: string;
  tokens_used: number;
  status: 'success' | 'failed';
  created_at: string;
}

export function TokenUsage() {
  const [usageHistory, setUsageHistory] = useState<TokenUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    fetchUsageHistory();
  }, []);

  const fetchUsageHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('token_usage')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(7); // Limit to 7 most recent records

      if (error) throw error;

      setUsageHistory(data || []);
    } catch (err) {
      console.error('Error fetching token usage:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat('id-ID', {
      timeZone: TIME_ZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(new Date(date));
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Database className="w-8 h-8 text-purple-600" />
          <h1 className="text-3xl font-bold text-gray-900">Token Usage History</h1>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Database className="w-8 h-8 text-purple-600" />
        <h1 className="text-3xl font-bold text-gray-900">Token Usage History</h1>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6">
        {usageHistory.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Service</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Tokens Used</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Date</th>
                </tr>
              </thead>
              <tbody>
                {usageHistory.map((usage) => (
                  <tr key={usage.id} className="border-b border-gray-100 last:border-0">
                    <td className="py-3 px-4">
                      <span className="capitalize">{usage.service.replace(/_/g, ' ')}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        <span>{usage.tokens_used}</span>
                        {usage.status === 'failed' && (
                          <span className="text-xs text-gray-500">(not deducted)</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`
                        inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium
                        ${usage.status === 'success' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'}
                      `}>
                        {usage.status === 'success' ? (
                          <Clock className="w-3 h-3" />
                        ) : (
                          <AlertCircle className="w-3 h-3" />
                        )}
                        {usage.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {formatDate(usage.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No token usage history found
          </div>
        )}
      </div>
    </div>
  );
}
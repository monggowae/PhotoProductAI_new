import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { Loader2, LogOut, PenTool as Tokens, Edit2 } from 'lucide-react';

export function UserProfile() {
  const { user, logout, requestToken, tokenRequests, approveTokenRequest, rejectTokenRequest, updateTokenRequest } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [tokenAmount, setTokenAmount] = useState(1);
  const [editingRequestId, setEditingRequestId] = useState<string | null>(null);
  
  const handleRequestToken = async () => {
    setLoading(true);
    try {
      await requestToken(tokenAmount);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: string, amount: number) => {
    setLoading(true);
    try {
      await approveTokenRequest(requestId, amount);
      setEditingRequestId(null);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (requestId: string) => {
    setLoading(true);
    try {
      await rejectTokenRequest(requestId);
      setEditingRequestId(null);
    } finally {
      setLoading(false);
    }
  };
  
  if (!user) return null;

  const userRequests = tokenRequests.filter(r => r.userId === user.id);
  const pendingRequests = tokenRequests.filter(r => r.status === 'pending');
  const completedRequests = tokenRequests.filter(r => r.status !== 'pending');
  
  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Profile</h2>
        <button
          onClick={logout}
          className="text-gray-600 hover:text-gray-800 flex items-center gap-2"
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>
      </div>
      
      <div className="space-y-6">
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-500">Name</p>
            <p className="text-lg font-medium">{user.name}</p>
          </div>
          
          <div>
            <p className="text-sm text-gray-500">Email</p>
            <p className="text-lg font-medium">{user.email}</p>
          </div>
          
          <div>
            <p className="text-sm text-gray-500">Role</p>
            <p className="text-lg font-medium capitalize">{user.role}</p>
          </div>
          
          <div>
            <p className="text-sm text-gray-500">Available API Tokens</p>
            <p className="text-lg font-medium">{user.apiTokens}</p>
          </div>
        </div>

        {user.role === 'user' && (
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Request API Tokens</h3>
            <div className="flex items-end gap-4">
              <div className="flex-1">
                <label htmlFor="tokenAmount" className="block text-sm font-medium text-gray-700 mb-1">
                  Number of Tokens
                </label>
                <input
                  type="number"
                  id="tokenAmount"
                  min="1"
                  value={tokenAmount}
                  onChange={(e) => setTokenAmount(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                onClick={handleRequestToken}
                disabled={loading}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Requesting...
                  </>
                ) : (
                  <>
                    <Tokens className="w-5 h-5" />
                    Request Tokens
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {user.role === 'user' && userRequests.length > 0 && (
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Your Token Requests</h3>
            <div className="space-y-4">
              {userRequests.map(request => (
                <div
                  key={request.id}
                  className="bg-gray-50 rounded-lg p-4 flex items-center justify-between"
                >
                  <div>
                    <p className="font-medium">{request.amount} Tokens</p>
                    <p className="text-sm text-gray-500">
                      {new Date(request.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`
                    px-3 py-1 rounded-full text-sm font-medium
                    ${request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : ''}
                    ${request.status === 'approved' ? 'bg-green-100 text-green-800' : ''}
                    ${request.status === 'rejected' ? 'bg-red-100 text-red-800' : ''}
                  `}>
                    {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {user.role === 'admin' && (
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Pending Token Requests</h3>
            <div className="space-y-4">
              {pendingRequests.length > 0 ? (
                pendingRequests.map(request => (
                  <div key={request.id} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-medium">{request.userEmail}</p>
                        {editingRequestId === request.id ? (
                          <div className="flex items-center gap-2 mt-1">
                            <input
                              type="number"
                              min="1"
                              value={request.amount}
                              onChange={(e) => updateTokenRequest(request.id, Math.max(1, parseInt(e.target.value) || 1))}
                              className="w-24 rounded border border-gray-300 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-500">tokens</span>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500 flex items-center gap-2">
                            Requested {request.amount} tokens • {new Date(request.createdAt).toLocaleDateString()}
                            <button
                              onClick={() => setEditingRequestId(request.id)}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApprove(request.id, request.amount)}
                          disabled={loading}
                          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(request.id)}
                          disabled={loading}
                          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">No pending token requests</p>
              )}
            </div>

            {completedRequests.length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-semibold mb-4">Request History</h3>
                <div className="space-y-4">
                  {completedRequests.map(request => (
                    <div
                      key={request.id}
                      className="bg-gray-50 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{request.userEmail}</p>
                          <p className="text-sm text-gray-500">
                            {request.amount} tokens • {new Date(request.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <span className={`
                          px-3 py-1 rounded-full text-sm font-medium
                          ${request.status === 'approved' ? 'bg-green-100 text-green-800' : ''}
                          ${request.status === 'rejected' ? 'bg-red-100 text-red-800' : ''}
                        `}>
                          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
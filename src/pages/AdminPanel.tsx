import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import { AdminHeader } from '../components/admin/AdminHeader';
import { RequestsPanel } from '../components/admin/RequestsPanel';
import { SettingsForm } from '../components/admin/SettingsForm';
import { NotificationSettings } from '../components/admin/NotificationSettings';
import { Settings } from '../types/settings';

const ITEMS_PER_PAGE = 10;

export function AdminPanel() {
  const user = useAuthStore((state) => state.user);
  const [activeTab, setActiveTab] = useState<'requests' | 'settings' | 'notifications'>('requests');
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const { tokenRequests, approveTokenRequest, rejectTokenRequest } = useAuthStore();
  const [currentPage, setCurrentPage] = useState(1);
  const [updatingSettings, setUpdatingSettings] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    fetchSettings();
    fetchAllRequests();
  }, []);

  const fetchSettings = async () => {
    const { data, error } = await supabase
      .from('settings')
      .select('*');

    if (!error && data) {
      const settingsMap = data.reduce((acc, setting) => ({
        ...acc,
        [setting.key]: setting.value
      }), {}) as Settings;

      setSettings(settingsMap);
    }
  };

  const fetchAllRequests = async () => {
    if (user?.role !== 'admin') return;

    const { data, error } = await supabase
      .from('token_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      const transformedRequests = data.map(request => ({
        id: request.id,
        userId: request.user_id,
        userEmail: request.user_email,
        amount: request.amount,
        status: request.status,
        createdAt: request.created_at
      }));

      useAuthStore.setState({ tokenRequests: transformedRequests });
    }
  };

  const handleUpdateAmount = async (requestId: string, amount: number) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('token_requests')
        .update({ amount })
        .eq('id', requestId);

      if (error) throw error;

      await fetchAllRequests();
    } catch (err) {
      console.error('Failed to update amount:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (key: string, value: any) => {
    setUpdatingSettings(prev => ({ ...prev, [key]: true }));
    try {
      await supabase.rpc('update_setting', {
        setting_key: key,
        new_value: value
      });
      await fetchSettings();
    } finally {
      setUpdatingSettings(prev => ({ ...prev, [key]: false }));
    }
  };

  const filteredRequests = tokenRequests.filter(request => {
    if (statusFilter !== 'all' && request.status !== statusFilter) return false;
    if (searchTerm && !request.userEmail.toLowerCase().includes(searchTerm.toLowerCase())) return false;

    const requestDate = new Date(request.createdAt);
    requestDate.setHours(0, 0, 0, 0);

    if (dateRange.start) {
      const startDate = new Date(dateRange.start);
      startDate.setHours(0, 0, 0, 0);
      if (requestDate < startDate) return false;
    }

    if (dateRange.end) {
      const endDate = new Date(dateRange.end);
      endDate.setHours(23, 59, 59, 999);
      if (requestDate > endDate) return false;
    }

    return true;
  });

  const paginatedRequests = filteredRequests.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const totalPages = Math.ceil(filteredRequests.length / ITEMS_PER_PAGE);

  const exportCSV = () => {
    const headers = ['User', 'Email', 'Amount', 'Status', 'Date'];
    const rows = filteredRequests.map(request => [
      request.userId,
      request.userEmail,
      request.amount,
      request.status,
      new Date(request.createdAt).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'token-requests.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (user?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  if (!settings) {
    return <div>Loading...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto">
      <AdminHeader
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {activeTab === 'requests' && (
        <RequestsPanel
          requests={paginatedRequests}
          statusFilter={statusFilter}
          dateRange={dateRange}
          searchTerm={searchTerm}
          currentPage={currentPage}
          totalPages={totalPages}
          loading={loading}
          onStatusChange={setStatusFilter}
          onDateRangeChange={setDateRange}
          onSearchChange={setSearchTerm}
          onPageChange={setCurrentPage}
          onApprove={approveTokenRequest}
          onReject={rejectTokenRequest}
          onUpdateAmount={handleUpdateAmount}
          onExport={exportCSV}
        />
      )}

      {activeTab === 'settings' && (
        <SettingsForm
          settings={settings}
          onUpdate={updateSetting}
          updatingSettings={updatingSettings}
        />
      )}

      {activeTab === 'notifications' && (
        <NotificationSettings />
      )}
    </div>
  );
}
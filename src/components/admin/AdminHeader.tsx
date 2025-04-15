import React from 'react';
import { Coins, Clock, Bell } from 'lucide-react';

interface AdminHeaderProps {
  activeTab: 'requests' | 'settings' | 'notifications';
  onTabChange: (tab: 'requests' | 'settings' | 'notifications') => void;
}

export function AdminHeader({ activeTab, onTabChange }: AdminHeaderProps) {
  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
        <p className="text-gray-600 mt-2">
          Manage users, token requests, and system settings
        </p>
      </div>

      <div className="mb-8 border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => onTabChange('requests')}
            className={`pb-4 px-1 ${
              activeTab === 'requests'
                ? 'border-b-2 border-purple-500 text-purple-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Coins className="w-5 h-5 inline-block mr-2" />
            Requests
          </button>
          <button
            onClick={() => onTabChange('settings')}
            className={`pb-4 px-1 ${
              activeTab === 'settings'
                ? 'border-b-2 border-purple-500 text-purple-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Clock className="w-5 h-5 inline-block mr-2" />
            Settings
          </button>
          <button
            onClick={() => onTabChange('notifications')}
            className={`pb-4 px-1 ${
              activeTab === 'notifications'
                ? 'border-b-2 border-purple-500 text-purple-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Bell className="w-5 h-5 inline-block mr-2" />
            Notifications
          </button>
        </nav>
      </div>
    </>
  );
}
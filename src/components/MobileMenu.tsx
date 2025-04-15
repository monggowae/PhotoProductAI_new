import React from 'react';
import { X, LogOut, Camera, LayoutDashboard, Image, Dog, Utensils, Paintbrush, UserCog, Send, Coins, Database, HelpCircle } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const isActive = (path: string) => location.pathname === path;

  const handleNavigation = (path: string) => {
    navigate(path);
    onClose();
  };

  const handleLogout = () => {
    logout();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />

      {/* Menu panel */}
      <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b shrink-0">
          <div className="flex items-center gap-2">
            <Camera className="w-6 h-6 text-purple-600" />
            <span className="text-lg font-semibold text-gray-900">Menu</span>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-6">
            {/* User Profile Button */}
            <button
              onClick={() => handleNavigation('/profile')}
              className="w-full bg-gray-50 rounded-lg p-3 text-left hover:bg-gray-100 transition-colors"
            >
              <div className="text-sm font-medium text-gray-700">{user?.name}</div>
              <div className="mt-1 text-xs font-medium text-purple-600">
                {user?.apiTokens} tokens available
              </div>
            </button>

            {/* Admin Section */}
            {user?.role === 'admin' && (
              <div>
                <div className="px-3 mb-2 text-xs font-semibold text-gray-500 uppercase">
                  Admin
                </div>
                <button
                  onClick={() => handleNavigation('/admin')}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
                    isActive('/admin')
                      ? 'bg-purple-50 text-purple-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <UserCog className="w-5 h-5" />
                  Admin Panel
                </button>
              </div>
            )}

            {/* General Section */}
            <div>
              <div className="px-3 mb-2 text-xs font-semibold text-gray-500 uppercase">
                General
              </div>
              <div className="space-y-1">
                <button
                  onClick={() => handleNavigation('/')}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
                    isActive('/')
                      ? 'bg-purple-50 text-purple-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <LayoutDashboard className="w-5 h-5" />
                  Dashboard
                </button>
                <button
                  onClick={() => handleNavigation('/token-requests')}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
                    isActive('/token-requests')
                      ? 'bg-purple-50 text-purple-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Coins className="w-5 h-5" />
                  Token Requests
                </button>
                <button
                  onClick={() => handleNavigation('/token-usage')}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
                    isActive('/token-usage')
                      ? 'bg-purple-50 text-purple-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Database className="w-5 h-5" />
                  Token Usage
                </button>
                <button
                  onClick={() => handleNavigation('/transfer')}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
                    isActive('/transfer')
                      ? 'bg-purple-50 text-purple-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Send className="w-5 h-5" />
                  Transfer Tokens
                </button>
              </div>
            </div>

            {/* Photo Tools Section */}
            <div>
              <div className="px-3 mb-2 text-xs font-semibold text-gray-500 uppercase">
                Photo Tools
              </div>
              <div className="space-y-1">
                <button
                  onClick={() => handleNavigation('/product')}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
                    isActive('/product')
                      ? 'bg-purple-50 text-purple-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Image className="w-5 h-5" />
                  Product Photos
                </button>
                <button
                  onClick={() => handleNavigation('/fashion')}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
                    isActive('/fashion')
                      ? 'bg-purple-50 text-purple-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Camera className="w-5 h-5" />
                  Fashion Photos
                </button>
                <button
                  onClick={() => handleNavigation('/animals')}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
                    isActive('/animals')
                      ? 'bg-purple-50 text-purple-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Dog className="w-5 h-5" />
                  Animal Photos
                </button>
                <button
                  onClick={() => handleNavigation('/food')}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
                    isActive('/food')
                      ? 'bg-purple-50 text-purple-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Utensils className="w-5 h-5" />
                  Food Photos
                </button>
                <button
                  onClick={() => handleNavigation('/modify')}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
                    isActive('/modify')
                      ? 'bg-purple-50 text-purple-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Paintbrush className="w-5 h-5" />
                  Photo Modification
                </button>
              </div>
            </div>

            {/* Help & Support Section */}
            <div>
              <div className="px-3 mb-2 text-xs font-semibold text-gray-500 uppercase">
                Support
              </div>
              <button
                onClick={() => handleNavigation('/help')}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
                  isActive('/help')
                    ? 'bg-purple-50 text-purple-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <HelpCircle className="w-5 h-5" />
                Help & Support
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t shrink-0">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
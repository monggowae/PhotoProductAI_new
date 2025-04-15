import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Camera, 
  LayoutDashboard, 
  LogOut,
  Image,
  Dog,
  Utensils,
  Paintbrush,
  UserCog,
  Send,
  Coins,
  Database,
  HelpCircle
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  
  const isActive = (path: string) => location.pathname === path;
  
  return (
    <div className="w-64 bg-white h-screen fixed left-0 top-0 border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-4 shrink-0">
        <Link to="/" className="flex items-center gap-2 text-purple-600">
          <Camera className="w-8 h-8" />
          <span className="text-lg font-semibold">PhotoProductAI</span>
        </Link>
      </div>
      
      {/* User Profile Button */}
      <div className="px-4 py-2 shrink-0">
        <button
          onClick={() => navigate('/profile')}
          className="w-full bg-gray-50 rounded-lg p-3 text-left hover:bg-gray-100 transition-colors"
        >
          <div className="text-sm font-medium text-gray-700">{user?.name}</div>
          <div className="mt-1 text-xs font-medium text-purple-600">
            {user?.apiTokens} tokens available
          </div>
        </button>
      </div>

      {/* Scrollable Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-4">
        {/* Admin Section */}
        {user?.role === 'admin' && (
          <div className="mb-4">
            <div className="px-3 mb-2 text-xs font-semibold text-gray-500 uppercase">
              Admin
            </div>
            <Link
              to="/admin"
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
                isActive('/admin')
                  ? 'bg-purple-50 text-purple-700'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <UserCog className="w-5 h-5" />
              Admin Panel
            </Link>
          </div>
        )}

        {/* General Section */}
        <div className="mb-4">
          <div className="px-3 mb-2 text-xs font-semibold text-gray-500 uppercase">
            General
          </div>
          <div className="space-y-1">
            <Link
              to="/"
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
                isActive('/')
                  ? 'bg-purple-50 text-purple-700'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <LayoutDashboard className="w-5 h-5" />
              Dashboard
            </Link>
            <Link
              to="/token-requests"
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
                isActive('/token-requests')
                  ? 'bg-purple-50 text-purple-700'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Coins className="w-5 h-5" />
              Token Requests
            </Link>
            <Link
              to="/token-usage"
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
                isActive('/token-usage')
                  ? 'bg-purple-50 text-purple-700'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Database className="w-5 h-5" />
              Token Usage
            </Link>
            <Link
              to="/transfer"
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
                isActive('/transfer')
                  ? 'bg-purple-50 text-purple-700'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Send className="w-5 h-5" />
              Transfer Tokens
            </Link>
          </div>
        </div>

        {/* Photo Tools Section */}
        <div className="mb-4">
          <div className="px-3 mb-2 text-xs font-semibold text-gray-500 uppercase">
            Photo Tools
          </div>
          <div className="space-y-1">
            <Link
              to="/product"
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
                isActive('/product')
                  ? 'bg-purple-50 text-purple-700'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Image className="w-5 h-5" />
              Product Photos
            </Link>
            <Link
              to="/fashion"
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
                isActive('/fashion')
                  ? 'bg-purple-50 text-purple-700'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Camera className="w-5 h-5" />
              Fashion Photos
            </Link>
            <Link
              to="/animals"
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
                isActive('/animals')
                  ? 'bg-purple-50 text-purple-700'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Dog className="w-5 h-5" />
              Animal Photos
            </Link>
            <Link
              to="/food"
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
                isActive('/food')
                  ? 'bg-purple-50 text-purple-700'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Utensils className="w-5 h-5" />
              Food Photos
            </Link>
            <Link
              to="/modify"
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
                isActive('/modify')
                  ? 'bg-purple-50 text-purple-700'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Paintbrush className="w-5 h-5" />
              Photo Modification
            </Link>
          </div>
        </div>

        {/* Help & Support Section */}
        <div>
          <div className="px-3 mb-2 text-xs font-semibold text-gray-500 uppercase">
            Support
          </div>
          <Link
            to="/help"
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
              isActive('/help')
                ? 'bg-purple-50 text-purple-700'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <HelpCircle className="w-5 h-5" />
            Help & Support
          </Link>
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t shrink-0">
        <button
          onClick={logout}
          className="flex items-center gap-2 w-full px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg"
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>
      </div>
    </div>
  );
}
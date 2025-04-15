import React, { useState, useEffect } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { AuthForm } from '../components/AuthForm';
import { useAuthStore } from '../store/authStore';

export function LoginPage() {
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<'login' | 'signup'>(
    searchParams.get('mode') === 'signup' ? 'signup' : 'login'
  );
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  // Update mode when URL parameter changes
  useEffect(() => {
    setMode(searchParams.get('mode') === 'signup' ? 'signup' : 'login');
  }, [searchParams]);
  
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <AuthForm
        mode={mode}
        onToggleMode={() => setMode(mode === 'login' ? 'signup' : 'login')}
      />
    </div>
  );
}
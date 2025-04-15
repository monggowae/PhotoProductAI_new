import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { AuthGuard } from './components/AuthGuard';
import { Layout } from './components/Layout';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { Generator } from './pages/Generator';
import { FashionPhoto } from './pages/FashionPhoto';
import { AnimalPhoto } from './pages/AnimalPhoto';
import { FoodPhoto } from './pages/FoodPhoto';
import { PhotoModification } from './pages/PhotoModification';
import { Dashboard } from './pages/Dashboard';
import { TokenRequests } from './pages/TokenRequests';
import { AdminPanel } from './pages/AdminPanel';
import { TransferTokens } from './pages/TransferTokens';
import { ProfileEdit } from './pages/ProfileEdit';
import { TokenUsage } from './pages/TokenUsage';
import { HelpSupport } from './pages/HelpSupport';

function App() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={!isAuthenticated ? <LandingPage /> : <Navigate to="/dashboard" />} />
        <Route path="/login" element={<LoginPage />} />

        {/* Protected routes */}
        <Route
          path="/dashboard"
          element={
            <AuthGuard>
              <Layout>
                <Dashboard />
              </Layout>
            </AuthGuard>
          }
        />
        <Route
          path="/token-requests"
          element={
            <AuthGuard>
              <Layout>
                <TokenRequests />
              </Layout>
            </AuthGuard>
          }
        />
        <Route
          path="/token-usage"
          element={
            <AuthGuard>
              <Layout>
                <TokenUsage />
              </Layout>
            </AuthGuard>
          }
        />
        <Route
          path="/profile"
          element={
            <AuthGuard>
              <Layout>
                <ProfileEdit />
              </Layout>
            </AuthGuard>
          }
        />
        <Route
          path="/admin"
          element={
            <AuthGuard>
              <Layout>
                <AdminPanel />
              </Layout>
            </AuthGuard>
          }
        />
        <Route
          path="/transfer"
          element={
            <AuthGuard>
              <Layout>
                <TransferTokens />
              </Layout>
            </AuthGuard>
          }
        />
        <Route
          path="/product"
          element={
            <AuthGuard>
              <Layout>
                <Generator />
              </Layout>
            </AuthGuard>
          }
        />
        <Route
          path="/fashion"
          element={
            <AuthGuard>
              <Layout>
                <FashionPhoto />
              </Layout>
            </AuthGuard>
          }
        />
        <Route
          path="/animals"
          element={
            <AuthGuard>
              <Layout>
                <AnimalPhoto />
              </Layout>
            </AuthGuard>
          }
        />
        <Route
          path="/food"
          element={
            <AuthGuard>
              <Layout>
                <FoodPhoto />
              </Layout>
            </AuthGuard>
          }
        />
        <Route
          path="/modify"
          element={
            <AuthGuard>
              <Layout>
                <PhotoModification />
              </Layout>
            </AuthGuard>
          }
        />
        <Route
          path="/help"
          element={
            <AuthGuard>
              <Layout>
                <HelpSupport />
              </Layout>
            </AuthGuard>
          }
        />
        
        {/* Catch all route - redirects to landing page */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
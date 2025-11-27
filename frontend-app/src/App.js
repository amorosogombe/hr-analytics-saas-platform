import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import OrganizationsPage from './pages/OrganizationsPage';
import UsersPage from './pages/UsersPage';
import './App.css';

// Protected Route Component
function ProtectedRoute({ children, requireSuperAdmin, requireManageUsers }) {
  const { user, loading, canManageOrganizations, canManageUsers } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  // Check approval status
  if (user.approvalStatus !== 'approved') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="bg-slate-800 p-8 rounded-2xl shadow-2xl border border-purple-500/20 max-w-md">
          <h2 className="text-2xl font-bold text-white mb-4">Account Pending Approval</h2>
          <p className="text-slate-300 mb-6">
            Your account is awaiting approval from an administrator. You'll receive an email once your account is activated.
          </p>
          <button
            onClick={() => window.location.href = '/login'}
            className="w-full px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  // Check permissions
  if (requireSuperAdmin && !canManageOrganizations()) {
    return <Navigate to="/dashboard" />;
  }

  if (requireManageUsers && !canManageUsers()) {
    return <Navigate to="/dashboard" />;
  }

  return <Layout>{children}</Layout>;
}

// App Content Component (needs to be inside AuthProvider to use useAuth)
function AppContent() {
  const { logout, user } = useAuth();

  useEffect(() => {
    // Auto-logout when browser/tab closes
    const handleBeforeUnload = (e) => {
      // Only logout if user is authenticated
      if (user) {
        logout();
      }
    };

    // Handle browser close/refresh
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Handle visibility change (when tab is hidden/shown)
    const handleVisibilityChange = () => {
      if (document.hidden && user) {
        // Store timestamp when tab becomes hidden
        sessionStorage.setItem('lastActiveTime', Date.now().toString());
      } else if (!document.hidden && user) {
        // Check if we should logout when tab becomes visible again
        const lastActive = sessionStorage.getItem('lastActiveTime');
        if (lastActive) {
          const inactiveTime = Date.now() - parseInt(lastActive);
          // If inactive for more than 30 minutes, logout
          if (inactiveTime > 30 * 60 * 1000) {
            logout();
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [logout, user]);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/organizations"
          element={
            <ProtectedRoute requireSuperAdmin={true}>
              <OrganizationsPage />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/users"
          element={
            <ProtectedRoute requireManageUsers={true}>
              <UsersPage />
            </ProtectedRoute>
          }
        />
        
        <Route path="/" element={<Navigate to="/dashboard" />} />
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;

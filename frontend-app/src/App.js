import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import OrganizationsPage from './pages/OrganizationsPage';
import UsersPage from './pages/UsersPage';

// Protected Route Component
function ProtectedRoute({ children, requiredPermission }) {
  const { user, loading } = useAuth();

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

  if (requiredPermission && !requiredPermission()) {
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
        // Use sendBeacon for reliable logout on page unload
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
            <ProtectedRoute requiredPermission={() => {
              const { canManageOrganizations } = useAuth();
              return canManageOrganizations();
            }}>
              <OrganizationsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/users"
          element={
            <ProtectedRoute requiredPermission={() => {
              const { canManageUsers } = useAuth();
              return canManageUsers();
            }}>
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

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Layouts
import { 
  SuperAdminLayout, 
  BankAdminLayout, 
  InvestorAdminLayout,
  BankUserLayout,
  InvestorUserLayout 
} from './components/layouts/DashboardLayouts';

// Auth Pages
import LoginPage from './components/auth/LoginPage';
import InvestorRegistrationPage from './components/auth/InvestorRegistrationPage';
import BankRegistrationPage from './components/auth/BankRegistrationPage';

// Public Pages
import HomePage from './components/pages/HomePage';

// Super Admin Pages
import SuperAdminDashboard from './components/super-admin/SuperAdminDashboard';

// Bank Pages
import BankAdminDashboard from './components/bank/BankAdminDashboard';

// Investor Pages
import InvestorUserDashboard from './components/investor/InvestorUserDashboard';
import InvestmentOpportunitiesPage from './components/investor/InvestmentOpportunitiesPage';

// Registration Router Component
const RegisterRouter = () => {
  return (
    <div className="min-h-screen bg-gradient-subtle py-8 px-4">
      <div className="max-w-xl mx-auto text-center">
        <div className="bg-white rounded-2xl shadow-soft p-8 border border-gray-100">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Create Your Account</h1>
          <p className="text-gray-500 mb-8">Choose your account type to get started</p>
          
          <div className="space-y-4">
            <a 
              href="/register/investor"
              className="block w-full p-6 bg-gray-50 rounded-xl border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center group-hover:bg-primary-200 transition-colors">
                  <svg className="w-6 h-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-gray-900">Impact Investor</h3>
                  <p className="text-sm text-gray-500">Access high-yield frontier market opportunities</p>
                </div>
              </div>
            </a>
            
            <a 
              href="/register/bank"
              className="block w-full p-6 bg-gray-50 rounded-xl border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center group-hover:bg-green-200 transition-colors">
                  <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-gray-900">Partner Bank</h3>
                  <p className="text-sm text-gray-500">Access capital markets and mobile lending</p>
                </div>
              </div>
            </a>
          </div>
          
          <p className="mt-6 text-sm text-gray-500">
            Already have an account?{' '}
            <a href="/login" className="text-primary-600 hover:text-primary-700 font-medium">
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

// Placeholder pages for routes that don't have full implementations yet
const PlaceholderPage = ({ title, description }) => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
      <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    </div>
    <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
    <p className="text-gray-500 max-w-md">{description || 'This page is under development.'}</p>
  </div>
);

// Unauthorized Page
const UnauthorizedPage = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
    <div className="text-center">
      <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg className="w-10 h-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
      <p className="text-gray-500 mb-6">You don't have permission to access this page.</p>
      <a 
        href="/login" 
        className="inline-flex items-center px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
      >
        Return to Login
      </a>
    </div>
  </div>
);

// Smart Redirect Component
const SmartRedirect = () => {
  const { user, isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  // Redirect based on user role
  switch (user.role) {
    case 'super_admin':
      return <Navigate to="/admin" replace />;
    case 'tenant_admin':
      return user.tenantType === 'investor' 
        ? <Navigate to="/investor/admin" replace />
        : <Navigate to="/bank/admin" replace />;
    case 'tenant_user':
      return user.tenantType === 'investor'
        ? <Navigate to="/investor" replace />
        : <Navigate to="/bank" replace />;
    default:
      return <Navigate to="/login" replace />;
  }
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterRouter />} />
          <Route path="/register/investor" element={<InvestorRegistrationPage />} />
          <Route path="/register/bank" element={<BankRegistrationPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
          
          {/* Smart Dashboard Redirect */}
          <Route path="/dashboard" element={<SmartRedirect />} />
          
          {/* Super Admin Routes */}
          <Route path="/admin" element={<SuperAdminLayout />}>
            <Route index element={<SuperAdminDashboard />} />
            <Route path="analytics" element={<PlaceholderPage title="Platform Analytics" />} />
            <Route path="investors" element={<PlaceholderPage title="Investor Management" description="Manage investor tenants and their accounts." />} />
            <Route path="banks" element={<PlaceholderPage title="Bank Management" description="Manage partner bank tenants and their accounts." />} />
            <Route path="users" element={<PlaceholderPage title="User Management" description="View and manage all platform users." />} />
            <Route path="instruments" element={<PlaceholderPage title="All Instruments" />} />
            <Route path="transactions" element={<PlaceholderPage title="Transaction Oversight" />} />
            <Route path="pnl" element={<PlaceholderPage title="Platform P&L" />} />
            <Route path="compliance" element={<PlaceholderPage title="Compliance Management" />} />
            <Route path="risk" element={<PlaceholderPage title="Risk Management" />} />
            <Route path="notifications" element={<PlaceholderPage title="Notifications" />} />
            <Route path="settings" element={<PlaceholderPage title="System Settings" />} />
          </Route>
          
          {/* Bank Admin Routes */}
          <Route path="/bank/admin" element={<BankAdminLayout />}>
            <Route index element={<BankAdminDashboard />} />
            <Route path="users" element={<PlaceholderPage title="User Management" description="Manage your bank's staff accounts and permissions." />} />
            <Route path="instruments" element={<PlaceholderPage title="Deposit Instruments" description="Create and manage deposit instruments." />} />
            <Route path="settlement" element={<PlaceholderPage title="Settlement Management" />} />
            <Route path="compliance" element={<PlaceholderPage title="Legal & Compliance" />} />
            <Route path="lending" element={<PlaceholderPage title="Mobile Lending Operations" description="Manage loan applications and disbursements." />} />
            <Route path="analytics" element={<PlaceholderPage title="Analytics Dashboard" />} />
            <Route path="reports" element={<PlaceholderPage title="Reports" />} />
            <Route path="pnl" element={<PlaceholderPage title="Mobile Lending P&L" />} />
            <Route path="notifications" element={<PlaceholderPage title="Notifications" />} />
            <Route path="settings" element={<PlaceholderPage title="Account Settings" />} />
          </Route>
          
          {/* Bank User Routes */}
          <Route path="/bank" element={<BankUserLayout />}>
            <Route index element={<BankAdminDashboard />} />
            <Route path="instruments" element={<PlaceholderPage title="Deposit Instruments" />} />
            <Route path="lending" element={<PlaceholderPage title="Mobile Lending" />} />
            <Route path="settlements" element={<PlaceholderPage title="Settlements" />} />
            <Route path="analytics" element={<PlaceholderPage title="Analytics" />} />
            <Route path="reports" element={<PlaceholderPage title="Reports" />} />
            <Route path="notifications" element={<PlaceholderPage title="Notifications" />} />
            <Route path="settings" element={<PlaceholderPage title="Settings" />} />
          </Route>
          
          {/* Investor Admin Routes */}
          <Route path="/investor/admin" element={<InvestorAdminLayout />}>
            <Route index element={<InvestorUserDashboard />} />
            <Route path="analytics" element={<PlaceholderPage title="Portfolio Analytics" />} />
            <Route path="users" element={<PlaceholderPage title="User Management" description="Manage your organization's user accounts." />} />
            <Route path="roles" element={<PlaceholderPage title="Roles & Permissions" />} />
            <Route path="investments" element={<PlaceholderPage title="Active Investments" />} />
            <Route path="opportunities" element={<InvestmentOpportunitiesPage />} />
            <Route path="reports" element={<PlaceholderPage title="Reports" />} />
            <Route path="performance" element={<PlaceholderPage title="Performance" />} />
            <Route path="notifications" element={<PlaceholderPage title="Notifications" />} />
            <Route path="settings" element={<PlaceholderPage title="Account Settings" />} />
          </Route>
          
          {/* Investor User Routes */}
          <Route path="/investor" element={<InvestorUserLayout />}>
            <Route index element={<InvestorUserDashboard />} />
            <Route path="calls" element={<InvestmentOpportunitiesPage />} />
            <Route path="puts" element={<PlaceholderPage title="Create Investment Request" description="Submit investment requests to partner banks." />} />
            <Route path="portfolio" element={<PlaceholderPage title="Portfolio" />} />
            <Route path="analytics" element={<PlaceholderPage title="Analytics" />} />
            <Route path="reports" element={<PlaceholderPage title="Reports" />} />
            <Route path="messages" element={<PlaceholderPage title="Messages" />} />
            <Route path="notifications" element={<PlaceholderPage title="Notifications" />} />
            <Route path="settings" element={<PlaceholderPage title="Settings" />} />
          </Route>
          
          {/* Catch all - redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Amplify } from 'aws-amplify';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import awsConfig from './aws-exports';
import SuperAdminPortal from './components/SuperAdminPortal';

// Configure Amplify
Amplify.configure(awsConfig);

function App() {
  return (
    <Authenticator>
      {({ signOut, user }) => (
        <BrowserRouter>
          <Routes>
            <Route path="/super-admin/*" element={
              <SuperAdminGuard user={user}>
                <SuperAdminPortal user={user} signOut={signOut} />
              </SuperAdminGuard>
            } />
            <Route path="/" element={<Dashboard user={user} signOut={signOut} />} />
          </Routes>
        </BrowserRouter>
      )}
    </Authenticator>
  );
}

// Super Admin Route Guard
function SuperAdminGuard({ user, children }) {
  const groups = user?.signInUserSession?.accessToken?.payload['cognito:groups'] || [];
  const isSuperAdmin = groups.includes('SuperAdmins');

  if (!isSuperAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return children;
}

// Placeholder Dashboard Component
function Dashboard({ user, signOut }) {
  const groups = user?.signInUserSession?.accessToken?.payload['cognito:groups'] || [];
  const isSuperAdmin = groups.includes('SuperAdmins');

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold">HR Analytics Platform</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{user?.attributes?.email}</span>
            {isSuperAdmin && (
              <a href="/super-admin" className="text-indigo-600 hover:text-indigo-700">
                Super Admin Portal
              </a>
            )}
            <button 
              onClick={signOut}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Sign Out
            </button>
          </div>
        </div>
      </nav>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-4">Welcome to HR Analytics</h2>
        <p className="text-gray-600">Your dashboard content will go here.</p>
      </div>
    </div>
  );
}

export default App;

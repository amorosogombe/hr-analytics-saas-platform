import React, { createContext, useState, useContext, useEffect } from 'react';
import { Amplify } from 'aws-amplify';
import { signIn, signOut, getCurrentUser, fetchAuthSession, signUp } from 'aws-amplify/auth';
import { awsConfig, APP_CONFIG } from '../aws-config';
import axios from 'axios';

// Configure Amplify
Amplify.configure(awsConfig);

const AuthContext = createContext(null);

// Helper: Clear ALL auth-related storage to fix "user already signed in" errors
const clearAllAuthStorage = () => {
  console.log('Clearing all auth storage...');
  
  // Clear all localStorage items related to Cognito/Amplify
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (
      key.startsWith('CognitoIdentityServiceProvider') ||
      key.startsWith('amplify') ||
      key.startsWith('Amplify') ||
      key.includes('cognito') ||
      key.includes('Cognito') ||
      key.includes('idToken') ||
      key.includes('accessToken') ||
      key.includes('refreshToken') ||
      key.includes('LastAuthUser') ||
      key.includes('userData')
    )) {
      keysToRemove.push(key);
    }
  }
  
  keysToRemove.forEach(key => {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.warn(`Failed to remove ${key}:`, e);
    }
  });

  // Also clear sessionStorage
  const sessionKeysToRemove = [];
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    if (key && (
      key.startsWith('CognitoIdentityServiceProvider') ||
      key.startsWith('amplify') ||
      key.includes('cognito')
    )) {
      sessionKeysToRemove.push(key);
    }
  }
  
  sessionKeysToRemove.forEach(key => {
    try {
      sessionStorage.removeItem(key);
    } catch (e) {
      console.warn(`Failed to remove session ${key}:`, e);
    }
  });

  console.log('All auth storage cleared');
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      setLoading(true);
      const currentUser = await getCurrentUser();
      const session = await fetchAuthSession();

      // Get user role from token
      const groups = session.tokens?.accessToken?.payload?.['cognito:groups'] || [];
      const role = session.tokens?.idToken?.payload?.['custom:role'] || 
                   (groups.includes('SuperAdmins') ? 'super_admin' :
                    groups.includes('OrgAdmins') ? 'org_admin' :
                    groups.includes('HRManagers') ? 'hr_manager' :
                    groups.includes('Supervisors') ? 'supervisor' : 'employee');

      // Try to fetch additional user details from API
      let apiUserData = {};
      try {
        const response = await axios.get(`${APP_CONFIG.apiUrl}/auth/me`, {
          headers: {
            Authorization: `Bearer ${session.tokens.idToken}`,
          },
        });
        apiUserData = response.data;
      } catch (apiErr) {
        console.log('Could not fetch user details from API, using token data');
      }

      setUser({
        ...currentUser,
        ...apiUserData,
        email: session.tokens?.idToken?.payload?.email || currentUser.username,
        name: session.tokens?.idToken?.payload?.name || apiUserData.name || currentUser.username,
        role: role,
        groups: groups,
        organizationId: session.tokens?.idToken?.payload?.['custom:organizationId'] || 'system',
        organizationName: apiUserData.organizationName || 'HR Analytics Platform',
        approvalStatus: session.tokens?.idToken?.payload?.['custom:approvalStatus'] || 'approved',
        token: session.tokens?.idToken?.toString(),
      });
    } catch (err) {
      console.log('Not authenticated:', err.message);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      setError(null);
      
      // CRITICAL FIX: Clear any existing session before login
      // This prevents "There is already a user signed in" errors
      clearAllAuthStorage();
      
      // Small delay to ensure storage is cleared
      await new Promise(resolve => setTimeout(resolve, 100));

      const { isSignedIn } = await signIn({ username: email, password });

      if (isSignedIn) {
        await checkAuthState();
        return { success: true };
      }
    } catch (err) {
      console.error('Login error:', err);
      
      // If we still get "already signed in" error, try clearing and retrying once
      if (err.message?.includes('already a user signed in') || err.name === 'UserAlreadyAuthenticatedException') {
        console.log('Clearing stale session and retrying...');
        clearAllAuthStorage();
        try {
          await signOut({ global: true });
        } catch (signOutErr) {
          // Ignore signout errors
        }
        clearAllAuthStorage();
        
        // Retry login
        try {
          await new Promise(resolve => setTimeout(resolve, 200));
          const { isSignedIn } = await signIn({ username: email, password });
          if (isSignedIn) {
            await checkAuthState();
            return { success: true };
          }
        } catch (retryErr) {
          console.error('Retry login failed:', retryErr);
          setError(retryErr.message || 'Failed to sign in');
          return { success: false, error: retryErr.message };
        }
      }
      
      setError(err.message || 'Failed to sign in');
      return { success: false, error: err.message };
    }
  };

  const register = async (email, password, fullName, organizationName, isOrgAdmin = false) => {
    try {
      setError(null);

      // Call our custom signup API
      const response = await axios.post(`${APP_CONFIG.apiUrl}/auth/signup`, {
        email,
        password,
        fullName,
        organizationName,
        isOrgAdmin,
      });

      return {
        success: true,
        message: response.data.message,
        approvalStatus: response.data.approvalStatus,
      };
    } catch (err) {
      console.error('Registration error:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Failed to register';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const logout = async () => {
    try {
      // Try global signout first (invalidates all sessions server-side)
      await signOut({ global: true });
    } catch (err) {
      console.warn('Global signout error (may be expected):', err);
      // Try regular signout as fallback
      try {
        await signOut();
      } catch (fallbackErr) {
        console.warn('Fallback signout error:', fallbackErr);
      }
    }
    
    // ALWAYS clear local storage regardless of signOut result
    clearAllAuthStorage();
    
    // Clear state
    setUser(null);
    setError(null);
  };

  // Force clear session - useful for stuck states
  const forceClearSession = () => {
    clearAllAuthStorage();
    setUser(null);
    setError(null);
  };

  const hasRole = (role) => {
    if (!user || !user.groups) return false;
    return user.groups.includes(role);
  };

  const isSuperAdmin = () => hasRole('SuperAdmins');
  const isOrgAdmin = () => hasRole('OrgAdmins');
  const isHRManager = () => hasRole('HRManagers');
  const isSupervisor = () => hasRole('Supervisors');
  const isEmployee = () => hasRole('Employees');

  const canManageOrganizations = () => isSuperAdmin();
  const canManageUsers = () => isSuperAdmin() || isOrgAdmin();
  const canViewAllMetrics = () => isSuperAdmin() || isOrgAdmin() || isHRManager() || isSupervisor();
  const canApproveComments = () => isSuperAdmin() || isOrgAdmin() || isHRManager() || isSupervisor();
  const canDeleteComments = () => isSuperAdmin() || isOrgAdmin() || isHRManager();

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    checkAuthState,
    forceClearSession,
    hasRole,
    isSuperAdmin,
    isOrgAdmin,
    isHRManager,
    isSupervisor,
    isEmployee,
    canManageOrganizations,
    canManageUsers,
    canViewAllMetrics,
    canApproveComments,
    canDeleteComments,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

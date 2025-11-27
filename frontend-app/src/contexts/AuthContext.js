import React, { createContext, useState, useContext, useEffect } from 'react';
import { Amplify } from 'aws-amplify';
import { signIn, signOut, getCurrentUser, fetchAuthSession, signUp } from 'aws-amplify/auth';
import { awsConfig, APP_CONFIG } from '../aws-config';
import axios from 'axios';

// Configure Amplify
Amplify.configure(awsConfig);

const AuthContext = createContext(null);

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
      
      // Fetch user details from API
      const response = await axios.get(`${APP_CONFIG.apiUrl}/auth/me`, {
        headers: {
          Authorization: `Bearer ${session.tokens.idToken}`,
        },
      });

      setUser({
        ...currentUser,
        ...response.data,
        groups: session.tokens.accessToken.payload['cognito:groups'] || [],
      });
    } catch (err) {
      console.log('Not authenticated:', err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      setError(null);
      
      // First, try to sign out any existing session
      try {
        await signOut({ global: true });
      } catch (signOutError) {
        console.log('No existing session to sign out:', signOutError);
      }
      
      // Clear all storage to ensure clean state
      clearAllStorage();
      
      // Now sign in
      const { isSignedIn } = await signIn({ username: email, password });
      
      if (isSignedIn) {
        await checkAuthState();
        return { success: true };
      }
    } catch (err) {
      console.error('Login error:', err);
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

  const clearAllStorage = () => {
    // Clear localStorage
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      // Remove all Amplify/Cognito related keys
      if (key && (
        key.includes('CognitoIdentityServiceProvider') ||
        key.includes('amplify') ||
        key.includes('aws') ||
        key.startsWith('@@auth')
      )) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    // Clear sessionStorage
    const sessionKeysToRemove = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && (
        key.includes('CognitoIdentityServiceProvider') ||
        key.includes('amplify') ||
        key.includes('aws') ||
        key.startsWith('@@auth')
      )) {
        sessionKeysToRemove.push(key);
      }
    }
    sessionKeysToRemove.forEach(key => sessionStorage.removeItem(key));
    
    console.log('All auth storage cleared');
  };

  const logout = async () => {
    try {
      console.log('Logging out...');
      
      // Sign out from Cognito with global flag to invalidate all tokens
      await signOut({ global: true });
      
      // Clear all storage
      clearAllStorage();
      
      // Clear user state
      setUser(null);
      
      console.log('Logout complete');
      
      // Small delay to ensure everything is cleared
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (err) {
      console.error('Logout error:', err);
      
      // Even if signOut fails, clear storage and user state
      clearAllStorage();
      setUser(null);
    }
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

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
};

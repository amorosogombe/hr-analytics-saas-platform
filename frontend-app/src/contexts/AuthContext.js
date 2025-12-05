import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { demoUsers, demoTenants } from '../data/mockData';

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

  // Check for existing session on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('forwardsflow_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('forwardsflow_user');
      }
    }
    setLoading(false);
  }, []);

  // Login function
  const login = useCallback(async (email, password, userType = null) => {
    setLoading(true);
    setError(null);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Find matching user
    let matchedUser = null;
    
    // Check all demo users
    for (const [key, userData] of Object.entries(demoUsers)) {
      if (userData.email.toLowerCase() === email.toLowerCase() && userData.password === password) {
        matchedUser = { ...userData };
        break;
      }
    }
    
    if (!matchedUser) {
      setError('Invalid email or password');
      setLoading(false);
      return { success: false, error: 'Invalid email or password' };
    }
    
    // Add tenant info if applicable
    if (matchedUser.tenantId) {
      const tenants = matchedUser.tenantType === 'investor' 
        ? demoTenants.investors 
        : demoTenants.banks;
      const tenant = tenants.find(t => t.id === matchedUser.tenantId);
      if (tenant) {
        matchedUser.tenant = tenant;
      }
    }
    
    // Update last login
    matchedUser.lastLogin = new Date().toISOString();
    
    // Save to localStorage
    localStorage.setItem('forwardsflow_user', JSON.stringify(matchedUser));
    setUser(matchedUser);
    setLoading(false);
    
    return { success: true, user: matchedUser };
  }, []);

  // Logout function
  const logout = useCallback(() => {
    localStorage.removeItem('forwardsflow_user');
    setUser(null);
    setError(null);
  }, []);

  // Register function (demo mode)
  const register = useCallback(async (registrationData) => {
    setLoading(true);
    setError(null);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // In demo mode, just create a user object
    const newUser = {
      id: `user-${Date.now()}`,
      email: registrationData.email,
      name: registrationData.name || 'New User',
      role: registrationData.role || 'tenant_user',
      tenantType: registrationData.tenantType,
      tenantName: registrationData.tenantName || registrationData.organizationName,
      jobRole: registrationData.jobRole,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      status: 'pending', // New registrations are pending approval
    };
    
    setLoading(false);
    
    // Don't auto-login on register - require admin approval
    return { 
      success: true, 
      message: 'Registration submitted successfully. Please wait for admin approval.',
      user: newUser 
    };
  }, []);

  // Update user profile
  const updateProfile = useCallback(async (updates) => {
    setLoading(true);
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const updatedUser = { ...user, ...updates };
    localStorage.setItem('forwardsflow_user', JSON.stringify(updatedUser));
    setUser(updatedUser);
    setLoading(false);
    
    return { success: true, user: updatedUser };
  }, [user]);

  // Check if user has specific role
  const hasRole = useCallback((role) => {
    if (!user) return false;
    return user.role === role;
  }, [user]);

  // Check if user is super admin
  const isSuperAdmin = useCallback(() => hasRole('super_admin'), [hasRole]);
  
  // Check if user is tenant admin
  const isTenantAdmin = useCallback(() => hasRole('tenant_admin'), [hasRole]);
  
  // Check if user is tenant user
  const isTenantUser = useCallback(() => hasRole('tenant_user'), [hasRole]);
  
  // Get user's dashboard path
  const getDashboardPath = useCallback(() => {
    if (!user) return '/login';
    
    switch (user.role) {
      case 'super_admin':
        return '/admin';
      case 'tenant_admin':
        return user.tenantType === 'investor' ? '/investor/admin' : '/bank/admin';
      case 'tenant_user':
        return user.tenantType === 'investor' ? '/investor' : '/bank';
      default:
        return '/login';
    }
  }, [user]);

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    register,
    updateProfile,
    hasRole,
    isSuperAdmin,
    isTenantAdmin,
    isTenantUser,
    getDashboardPath,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;

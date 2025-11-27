import React, { useState, useEffect } from 'react';
import { fetchAuthSession } from 'aws-amplify/auth';
import { APP_CONFIG } from '../aws-config';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

export default function UsersPage() {
  const { user: currentUser, isOrgAdmin, isSuperAdmin } = useAuth();
  
  const [users, setUsers] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showTab, setShowTab] = useState('pending'); // 'pending' or 'approved'

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const session = await fetchAuthSession();
      const response = await axios.get(`${APP_CONFIG.apiUrl}/users`, {
        headers: {
          Authorization: `Bearer ${session.tokens.idToken}`,
        },
      });
      
      // Separate pending and approved users
      const allUsers = response.data.users || [];
      setPendingUsers(allUsers.filter(u => u.approvalStatus === 'pending_approval'));
      setUsers(allUsers.filter(u => u.approvalStatus === 'approved'));
      
    } catch (err) {
      console.error('Error loading users:', err);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId) => {
    if (!window.confirm('Are you sure you want to approve this user?')) {
      return;
    }

    try {
      const session = await fetchAuthSession();
      await axios.post(
        `${APP_CONFIG.apiUrl}/users/${userId}/approve`,
        {},
        {
          headers: {
            Authorization: `Bearer ${session.tokens.idToken}`,
          },
        }
      );
      
      setSuccessMessage('User approved successfully');
      loadUsers();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error approving user:', err);
      setError(err.response?.data?.error || 'Failed to approve user');
      setTimeout(() => setError(''), 5000);
    }
  };

  const handleReject = async (userId) => {
    if (!window.confirm('Are you sure you want to reject this user? This will delete their account.')) {
      return;
    }

    try {
      const session = await fetchAuthSession();
      await axios.delete(
        `${APP_CONFIG.apiUrl}/users/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${session.tokens.idToken}`,
          },
        }
      );
      
      setSuccessMessage('User rejected and removed');
      loadUsers();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error rejecting user:', err);
      setError('Failed to reject user');
      setTimeout(() => setError(''), 5000);
    }
  };

  const getRoleBadge = (role) => {
    const styles = {
      SuperAdmins: 'bg-purple-500/20 text-purple-400 border-purple-500/50',
      OrgAdmins: 'bg-blue-500/20 text-blue-400 border-blue-500/50',
      HRManagers: 'bg-green-500/20 text-green-400 border-green-500/50',
      Supervisors: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
      Employees: 'bg-slate-500/20 text-slate-400 border-slate-500/50',
    };
    
    const names = {
      SuperAdmins: 'Super Admin',
      OrgAdmins: 'Org Admin',
      HRManagers: 'HR Manager',
      Supervisors: 'Supervisor',
      Employees: 'Employee',
    };
    
    return (
      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${styles[role] || styles.Employees}`}>
        {names[role] || role}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">User Management</h1>
        <button
          onClick={loadUsers}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 p-4 rounded-lg">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {successMessage && (
        <div className="bg-green-500/10 border border-green-500/50 p-4 rounded-lg">
          <p className="text-green-400">{successMessage}</p>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex space-x-2 border-b border-slate-700">
        <button
          onClick={() => setShowTab('pending')}
          className={`px-6 py-3 font-medium transition-colors ${
            showTab === 'pending'
              ? 'text-purple-400 border-b-2 border-purple-400'
              : 'text-slate-400 hover:text-slate-300'
          }`}
        >
          Pending Approval
          {pendingUsers.length > 0 && (
            <span className="ml-2 px-2 py-0.5 text-xs bg-purple-500/20 text-purple-400 rounded-full">
              {pendingUsers.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setShowTab('approved')}
          className={`px-6 py-3 font-medium transition-colors ${
            showTab === 'approved'
              ? 'text-purple-400 border-b-2 border-purple-400'
              : 'text-slate-400 hover:text-slate-300'
          }`}
        >
          Approved Users
          <span className="ml-2 px-2 py-0.5 text-xs bg-slate-700 text-slate-300 rounded-full">
            {users.length}
          </span>
        </button>
      </div>

      {/* Pending Users Table */}
      {showTab === 'pending' && (
        <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
          <div className="p-4 border-b border-slate-700">
            <h2 className="text-xl font-semibold text-white">Pending Approval</h2>
            <p className="text-sm text-slate-400 mt-1">
              {isOrgAdmin() ? 'Review and approve new user registrations for your organization' : 'Users awaiting approval'}
            </p>
          </div>

          {pendingUsers.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-500/20 mb-4">
                <svg className="h-8 w-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-slate-400">No pending approvals</p>
              <p className="text-sm text-slate-500 mt-1">All users have been reviewed</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-900/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                      Requested Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                      Registered
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                      Status
                    </th>
                    {(isOrgAdmin() || isSuperAdmin()) && (
                      <th className="px-6 py-3 text-right text-xs font-medium text-slate-300 uppercase tracking-wider">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {pendingUsers.map((user) => (
                    <tr key={user.userId} className="hover:bg-slate-700/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-white">{user.fullName}</div>
                        <div className="text-xs text-slate-400">{user.userId}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-300">{user.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getRoleBadge(user.role)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-2 w-2 rounded-full bg-yellow-400 mr-2 animate-pulse"></div>
                          <span className="text-sm text-yellow-400">Pending</span>
                        </div>
                      </td>
                      {(isOrgAdmin() || isSuperAdmin()) && (
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => handleApprove(user.userId)}
                              className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleReject(user.userId)}
                              className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                            >
                              Reject
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Approved Users Table */}
      {showTab === 'approved' && (
        <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
          <div className="p-4 border-b border-slate-700">
            <h2 className="text-xl font-semibold text-white">Approved Users</h2>
            <p className="text-sm text-slate-400 mt-1">
              Active users in your organization
            </p>
          </div>

          {users.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-400">No approved users yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-900/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                      Joined
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {users.map((user) => (
                    <tr key={user.userId} className="hover:bg-slate-700/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-white">{user.fullName}</div>
                        <div className="text-xs text-slate-400">{user.userId}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-300">{user.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getRoleBadge(user.role)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-2 w-2 rounded-full bg-green-400 mr-2"></div>
                          <span className="text-sm text-green-400">Active</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
          <p className="text-sm text-slate-400">Total Users</p>
          <p className="text-2xl font-bold text-white mt-1">{users.length + pendingUsers.length}</p>
        </div>
        <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
          <p className="text-sm text-slate-400">Approved</p>
          <p className="text-2xl font-bold text-green-400 mt-1">{users.length}</p>
        </div>
        <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
          <p className="text-sm text-slate-400">Pending Approval</p>
          <p className="text-2xl font-bold text-yellow-400 mt-1">{pendingUsers.length}</p>
        </div>
      </div>
    </div>
  );
}

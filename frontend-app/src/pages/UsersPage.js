import React, { useState, useEffect } from 'react';
import { fetchAuthSession } from 'aws-amplify/auth';
import { APP_CONFIG } from '../aws-config';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

export default function UsersPage() {
  const { user: currentUser, isSuperAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

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
        params: {
          organizationId: currentUser?.organizationId,
        },
      });
      setUsers(response.data.users);
    } catch (err) {
      console.error('Error loading users:', err);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId) => {
    try {
      const session = await fetchAuthSession();
      await axios.post(
        `${APP_CONFIG.apiUrl}/users/${userId}/approve`,
        {},
        {
          headers: {
            Authorization: `Bearer ${session.tokens.idToken}`,
          },
          params: {
            organizationId: currentUser?.organizationId,
          },
        }
      );
      setSuccessMessage('User approved successfully');
      loadUsers();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error approving user:', err);
      setError('Failed to approve user');
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) {
      return;
    }

    try {
      const session = await fetchAuthSession();
      await axios.delete(`${APP_CONFIG.apiUrl}/users/${userId}`, {
        headers: {
          Authorization: `Bearer ${session.tokens.idToken}`,
        },
        params: {
          organizationId: currentUser?.organizationId,
        },
      });
      setSuccessMessage('User deleted successfully');
      loadUsers();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error deleting user:', err);
      setError('Failed to delete user');
    }
  };

  const getRoleBadgeColor = (role) => {
    const colors = {
      org_admin: 'bg-purple-500/20 text-purple-400 border-purple-500/50',
      hr_manager: 'bg-blue-500/20 text-blue-400 border-blue-500/50',
      supervisor: 'bg-green-500/20 text-green-400 border-green-500/50',
      employee: 'bg-slate-500/20 text-slate-400 border-slate-500/50',
    };
    return colors[role] || colors.employee;
  };

  const getStatusBadgeColor = (status) => {
    const colors = {
      approved: 'bg-green-500/20 text-green-400 border-green-500/50',
      pending_approval: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
      rejected: 'bg-red-500/20 text-red-400 border-red-500/50',
    };
    return colors[status] || colors.pending_approval;
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
        <div className="flex space-x-3">
          <button
            onClick={loadUsers}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
          >
            Refresh
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
          >
            + Add User
          </button>
        </div>
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

      <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
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
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Actions
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
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getRoleBadgeColor(user.role)}`}>
                      {user.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                    {user.department || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getStatusBadgeColor(user.approvalStatus)}`}>
                      {user.approvalStatus.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      {user.approvalStatus === 'pending_approval' && (
                        <button
                          onClick={() => handleApprove(user.userId)}
                          className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
                        >
                          Approve
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(user.userId)}
                        className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {users.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-400">No users found in your organization</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
          <p className="text-sm text-slate-400">Total Users</p>
          <p className="text-2xl font-bold text-white mt-1">{users.length}</p>
        </div>
        <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
          <p className="text-sm text-slate-400">Pending Approval</p>
          <p className="text-2xl font-bold text-yellow-400 mt-1">
            {users.filter(u => u.approvalStatus === 'pending_approval').length}
          </p>
        </div>
        <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
          <p className="text-sm text-slate-400">Approved</p>
          <p className="text-2xl font-bold text-green-400 mt-1">
            {users.filter(u => u.approvalStatus === 'approved').length}
          </p>
        </div>
        <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
          <p className="text-sm text-slate-400">Supervisors+</p>
          <p className="text-2xl font-bold text-purple-400 mt-1">
            {users.filter(u => ['supervisor', 'hr_manager', 'org_admin'].includes(u.role)).length}
          </p>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { fetchAuthSession } from 'aws-amplify/auth';
import { APP_CONFIG } from '../aws-config';
import axios from 'axios';

export default function OrganizationsPage() {
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    loadOrganizations();
  }, []);

  const loadOrganizations = async () => {
    try {
      setLoading(true);
      const session = await fetchAuthSession();
      const response = await axios.get(`${APP_CONFIG.apiUrl}/organizations`, {
        headers: {
          Authorization: `Bearer ${session.tokens.idToken}`,
        },
      });
      setOrganizations(response.data.organizations);
    } catch (err) {
      console.error('Error loading organizations:', err);
      setError('Failed to load organizations');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (organizationId) => {
    try {
      const session = await fetchAuthSession();
      await axios.post(
        `${APP_CONFIG.apiUrl}/organizations/${organizationId}/approve`,
        {},
        {
          headers: {
            Authorization: `Bearer ${session.tokens.idToken}`,
          },
        }
      );
      setSuccessMessage('Organization approved successfully');
      loadOrganizations();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error approving organization:', err);
      setError('Failed to approve organization');
    }
  };

  const handleDelete = async (organizationId) => {
    if (!window.confirm('Are you sure you want to delete this organization?')) {
      return;
    }

    try {
      const session = await fetchAuthSession();
      await axios.delete(`${APP_CONFIG.apiUrl}/organizations/${organizationId}`, {
        headers: {
          Authorization: `Bearer ${session.tokens.idToken}`,
        },
      });
      setSuccessMessage('Organization deleted successfully');
      loadOrganizations();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error deleting organization:', err);
      setError('Failed to delete organization');
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      active: 'bg-green-500/20 text-green-400 border-green-500/50',
      pending_approval: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
      suspended: 'bg-red-500/20 text-red-400 border-red-500/50',
    };
    return styles[status] || styles.pending_approval;
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
        <h1 className="text-3xl font-bold text-white">Organizations Management</h1>
        <button
          onClick={loadOrganizations}
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

      <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-900/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Organization
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Subdomain
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Admin Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {organizations.map((org) => (
                <tr key={org.organizationId} className="hover:bg-slate-700/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-white">{org.name}</div>
                    <div className="text-xs text-slate-400">{org.organizationId}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-slate-300">{org.subdomain}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-slate-300">{org.adminEmail}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getStatusBadge(org.status)}`}>
                      {org.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                    {new Date(org.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      {org.status === 'pending_approval' && (
                        <button
                          onClick={() => handleApprove(org.organizationId)}
                          className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
                        >
                          Approve
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(org.organizationId)}
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

        {organizations.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-400">No organizations found</p>
          </div>
        )}
      </div>

      <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
        <p className="text-sm text-slate-400">
          <strong className="text-slate-300">Total Organizations:</strong> {organizations.length}
        </p>
        <p className="text-sm text-slate-400 mt-1">
          <strong className="text-slate-300">Pending Approval:</strong>{' '}
          {organizations.filter(o => o.status === 'pending_approval').length}
        </p>
      </div>
    </div>
  );
}

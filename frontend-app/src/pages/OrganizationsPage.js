import React, { useState, useEffect } from 'react';
import { fetchAuthSession } from 'aws-amplify/auth';
import { APP_CONFIG } from '../aws-config';
import axios from 'axios';

export default function OrganizationsPage() {
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [editingOrg, setEditingOrg] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

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

  const handleSuspend = async (organizationId, currentStatus) => {
    const newStatus = currentStatus === 'suspended' ? 'active' : 'suspended';
    const action = currentStatus === 'suspended' ? 'reactivate' : 'suspend';
    
    if (!window.confirm(`Are you sure you want to ${action} this organization?`)) {
      return;
    }

    try {
      const session = await fetchAuthSession();
      await axios.put(
        `${APP_CONFIG.apiUrl}/organizations/${organizationId}`,
        { status: newStatus },
        {
          headers: {
            Authorization: `Bearer ${session.tokens.idToken}`,
          },
        }
      );
      setSuccessMessage(`Organization ${action}ed successfully`);
      loadOrganizations();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error(`Error ${action}ing organization:`, err);
      setError(`Failed to ${action} organization`);
    }
  };

  const handleEdit = (org) => {
    setEditingOrg({ ...org });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editingOrg) return;

    try {
      const session = await fetchAuthSession();
      await axios.put(
        `${APP_CONFIG.apiUrl}/organizations/${editingOrg.organizationId}`,
        {
          name: editingOrg.name,
          subdomain: editingOrg.subdomain,
          adminEmail: editingOrg.adminEmail,
        },
        {
          headers: {
            Authorization: `Bearer ${session.tokens.idToken}`,
          },
        }
      );
      setSuccessMessage('Organization updated successfully');
      setShowEditModal(false);
      setEditingOrg(null);
      loadOrganizations();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error updating organization:', err);
      setError('Failed to update organization');
    }
  };

  const handleDelete = async (organizationId) => {
    if (!window.confirm('Are you sure you want to delete this organization? This action cannot be undone.')) {
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

  const handleViewAnalytics = (org) => {
    // Placeholder for analytics view
    alert(`Analytics for ${org.name}\n\nThis feature will display:\n- User activity\n- Dashboard usage\n- Performance metrics\n- Reports generated\n\n(Feature coming soon!)`);
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
                      {/* View Analytics Button */}
                      <button
                        onClick={() => handleViewAnalytics(org)}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors flex items-center gap-1"
                        title="View Analytics"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        Analytics
                      </button>

                      {/* Edit Button */}
                      <button
                        onClick={() => handleEdit(org)}
                        className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded transition-colors flex items-center gap-1"
                        title="Edit Organization"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit
                      </button>

                      {/* Approve Button (for pending) */}
                      {org.status === 'pending_approval' && (
                        <button
                          onClick={() => handleApprove(org.organizationId)}
                          className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
                        >
                          Approve
                        </button>
                      )}

                      {/* Suspend/Reactivate Button */}
                      {org.status !== 'pending_approval' && (
                        <button
                          onClick={() => handleSuspend(org.organizationId, org.status)}
                          className={`px-3 py-1 ${
                            org.status === 'suspended'
                              ? 'bg-green-600 hover:bg-green-700'
                              : 'bg-orange-600 hover:bg-orange-700'
                          } text-white rounded transition-colors`}
                        >
                          {org.status === 'suspended' ? 'Reactivate' : 'Suspend'}
                        </button>
                      )}

                      {/* Delete Button */}
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
          <strong className="text-slate-300">Active:</strong>{' '}
          {organizations.filter(o => o.status === 'active').length}
        </p>
        <p className="text-sm text-slate-400 mt-1">
          <strong className="text-slate-300">Pending Approval:</strong>{' '}
          {organizations.filter(o => o.status === 'pending_approval').length}
        </p>
        <p className="text-sm text-slate-400 mt-1">
          <strong className="text-slate-300">Suspended:</strong>{' '}
          {organizations.filter(o => o.status === 'suspended').length}
        </p>
      </div>

      {/* Edit Modal */}
      {showEditModal && editingOrg && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-lg p-6 w-full max-w-md border border-slate-700">
            <h2 className="text-2xl font-bold text-white mb-4">Edit Organization</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Organization Name
                </label>
                <input
                  type="text"
                  value={editingOrg.name}
                  onChange={(e) => setEditingOrg({ ...editingOrg, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Subdomain
                </label>
                <input
                  type="text"
                  value={editingOrg.subdomain}
                  onChange={(e) => setEditingOrg({ ...editingOrg, subdomain: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Admin Email
                </label>
                <input
                  type="email"
                  value={editingOrg.adminEmail}
                  onChange={(e) => setEditingOrg({ ...editingOrg, adminEmail: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="text-xs text-slate-400">
                <strong>ID:</strong> {editingOrg.organizationId}
              </div>
            </div>

            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingOrg(null);
                }}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

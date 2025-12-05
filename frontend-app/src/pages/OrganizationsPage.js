import React, { useState, useEffect, useCallback } from 'react';
import { 
  Building2, 
  Users, 
  Search, 
  Plus, 
  Check, 
  X, 
  Edit, 
  Pause, 
  Play, 
  BarChart3,
  AlertCircle,
  RefreshCw,
  ChevronDown,
  Filter
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

// Status Badge Component with null safety
const StatusBadge = ({ status }) => {
  const safeStatus = status?.toLowerCase() || 'unknown';
  const statusConfig = {
    active: { bg: 'bg-green-100', text: 'text-green-800', label: 'Active' },
    pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending' },
    suspended: { bg: 'bg-red-100', text: 'text-red-800', label: 'Suspended' },
    rejected: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Rejected' },
    unknown: { bg: 'bg-gray-100', text: 'text-gray-500', label: 'Unknown' }
  };
  
  const config = statusConfig[safeStatus] || statusConfig.unknown;
  
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  );
};

// Tier Badge Component with null safety
const TierBadge = ({ tier }) => {
  const safeTier = tier?.toLowerCase() || 'basic';
  const tierConfig = {
    enterprise: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Enterprise' },
    professional: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Professional' },
    basic: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Basic' },
    starter: { bg: 'bg-green-100', text: 'text-green-800', label: 'Starter' }
  };
  
  const config = tierConfig[safeTier] || tierConfig.basic;
  
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  );
};

// Edit Organization Modal
const EditModal = ({ organization, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: organization?.name || '',
    subdomain: organization?.subdomain || '',
    adminEmail: organization?.adminEmail || '',
    tier: organization?.tier || 'basic'
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({ ...organization, ...formData });
      onClose();
    } catch (error) {
      console.error('Error saving organization:', error);
      alert('Failed to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Edit Organization</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Organization Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subdomain
            </label>
            <div className="flex items-center">
              <input
                type="text"
                value={formData.subdomain}
                onChange={(e) => setFormData({ ...formData, subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              <span className="px-3 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-lg text-gray-500 text-sm">
                .yourdomain.com
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Admin Email
            </label>
            <input
              type="email"
              value={formData.adminEmail}
              onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subscription Tier
            </label>
            <select
              value={formData.tier}
              onChange={(e) => setFormData({ ...formData, tier: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="starter">Starter</option>
              <option value="basic">Basic</option>
              <option value="professional">Professional</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Organization Details Modal
const DetailsModal = ({ organization, onClose }) => {
  if (!organization) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">
              {organization.name || 'Unknown Organization'}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {organization.subdomain ? `${organization.subdomain}.yourdomain.com` : 'No subdomain'}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <StatusBadge status={organization.status} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Tier</p>
              <TierBadge tier={organization.tier} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Admin Email</p>
              <p className="text-sm font-medium text-gray-900">
                {organization.adminEmail || 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Users</p>
              <p className="text-sm font-medium text-gray-900">
                {organization.userCount ?? 0}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Data Sources</p>
              <p className="text-sm font-medium text-gray-900">
                {organization.dataSourcesConfigured ? 'Configured' : 'Not configured'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Created</p>
              <p className="text-sm font-medium text-gray-900">
                {organization.createdAt 
                  ? new Date(organization.createdAt).toLocaleDateString() 
                  : 'N/A'}
              </p>
            </div>
          </div>

          {organization.status === 'suspended' && organization.suspensionReason && (
            <div className="p-4 bg-red-50 rounded-lg">
              <p className="text-sm font-medium text-red-800">Suspension Reason:</p>
              <p className="text-sm text-red-700 mt-1">{organization.suspensionReason}</p>
            </div>
          )}
        </div>

        <div className="mt-6 pt-4 border-t">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// Main Organizations Page Component
const OrganizationsPage = () => {
  const { user } = useAuth();
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [editingOrg, setEditingOrg] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  // Fetch organizations
  const fetchOrganizations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Try to fetch from API
      const apiUrl = import.meta.env.VITE_API_URL;
      if (apiUrl) {
        const response = await fetch(`${apiUrl}/organizations`, {
          headers: {
            'Authorization': `Bearer ${user?.token || ''}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          // Ensure data is an array and each org has required properties
          const safeData = Array.isArray(data) ? data.map(org => ({
            id: org.id || org.organizationId || `org-${Math.random().toString(36).substr(2, 9)}`,
            name: org.name || 'Unnamed Organization',
            subdomain: org.subdomain || '',
            adminEmail: org.adminEmail || org.email || '',
            status: org.status || 'pending',
            tier: org.tier || 'basic',
            userCount: org.userCount ?? 0,
            dataSourcesConfigured: org.dataSourcesConfigured ?? false,
            createdAt: org.createdAt || new Date().toISOString(),
            ...org
          })) : [];
          setOrganizations(safeData);
          return;
        }
      }
      
      // Fall back to mock data if API fails or not configured
      setOrganizations(getMockOrganizations());
    } catch (err) {
      console.error('Error fetching organizations:', err);
      // Use mock data on error
      setOrganizations(getMockOrganizations());
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Mock data for development/fallback
  const getMockOrganizations = () => [
    {
      id: 'org-001',
      name: 'Acme Corporation',
      subdomain: 'acme',
      adminEmail: 'admin@acme.com',
      status: 'active',
      tier: 'enterprise',
      userCount: 150,
      dataSourcesConfigured: true,
      createdAt: '2024-01-15T10:00:00Z'
    },
    {
      id: 'org-002',
      name: 'TechStart Inc',
      subdomain: 'techstart',
      adminEmail: 'ceo@techstart.io',
      status: 'active',
      tier: 'professional',
      userCount: 45,
      dataSourcesConfigured: true,
      createdAt: '2024-02-20T14:30:00Z'
    },
    {
      id: 'org-003',
      name: 'Global Dynamics',
      subdomain: 'globaldyn',
      adminEmail: 'it@globaldynamics.com',
      status: 'pending',
      tier: 'enterprise',
      userCount: 0,
      dataSourcesConfigured: false,
      createdAt: '2024-03-10T09:15:00Z'
    },
    {
      id: 'org-004',
      name: 'Suspended Corp',
      subdomain: 'suspended',
      adminEmail: 'admin@suspended.com',
      status: 'suspended',
      tier: 'basic',
      userCount: 12,
      dataSourcesConfigured: true,
      createdAt: '2024-01-05T08:00:00Z',
      suspensionReason: 'Payment issues - Account past due'
    }
  ];

  useEffect(() => {
    fetchOrganizations();
  }, [fetchOrganizations]);

  // Filter organizations with null safety
  const filteredOrganizations = organizations.filter(org => {
    if (!org) return false;
    
    const matchesSearch = 
      (org.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (org.subdomain?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (org.adminEmail?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || 
      (org.status?.toLowerCase() || '') === statusFilter.toLowerCase();
    
    return matchesSearch && matchesStatus;
  });

  // Stats with null safety
  const stats = {
    total: organizations.length,
    active: organizations.filter(o => o?.status?.toLowerCase() === 'active').length,
    pending: organizations.filter(o => o?.status?.toLowerCase() === 'pending').length,
    suspended: organizations.filter(o => o?.status?.toLowerCase() === 'suspended').length
  };

  // Handle organization actions
  const handleApprove = async (org) => {
    if (!org?.id) return;
    setActionLoading(org.id);
    try {
      // API call would go here
      await new Promise(resolve => setTimeout(resolve, 500));
      setOrganizations(prev => 
        prev.map(o => o.id === org.id ? { ...o, status: 'active' } : o)
      );
    } catch (err) {
      console.error('Error approving organization:', err);
      alert('Failed to approve organization');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (org) => {
    if (!org?.id) return;
    if (!window.confirm(`Are you sure you want to reject ${org.name || 'this organization'}?`)) return;
    
    setActionLoading(org.id);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      setOrganizations(prev => 
        prev.map(o => o.id === org.id ? { ...o, status: 'rejected' } : o)
      );
    } catch (err) {
      console.error('Error rejecting organization:', err);
      alert('Failed to reject organization');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSuspend = async (org) => {
    if (!org?.id) return;
    const reason = window.prompt(`Enter reason for suspending ${org.name || 'this organization'}:`);
    if (!reason) return;
    
    setActionLoading(org.id);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      setOrganizations(prev => 
        prev.map(o => o.id === org.id ? { ...o, status: 'suspended', suspensionReason: reason } : o)
      );
    } catch (err) {
      console.error('Error suspending organization:', err);
      alert('Failed to suspend organization');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReactivate = async (org) => {
    if (!org?.id) return;
    if (!window.confirm(`Reactivate ${org.name || 'this organization'}?`)) return;
    
    setActionLoading(org.id);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      setOrganizations(prev => 
        prev.map(o => o.id === org.id ? { ...o, status: 'active', suspensionReason: null } : o)
      );
    } catch (err) {
      console.error('Error reactivating organization:', err);
      alert('Failed to reactivate organization');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSaveEdit = async (updatedOrg) => {
    if (!updatedOrg?.id) return;
    setOrganizations(prev => 
      prev.map(o => o.id === updatedOrg.id ? { ...o, ...updatedOrg } : o)
    );
  };

  const handleViewAnalytics = (org) => {
    alert(`Analytics dashboard for "${org?.name || 'Organization'}" - Coming soon!\n\nThis will open embedded QuickSight dashboards showing:\n• User activity metrics\n• Productivity scores\n• Engagement trends`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading organizations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Organization Management</h1>
        <p className="text-gray-600 mt-1">Manage all registered organizations</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Organizations</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <Building2 className="w-10 h-10 text-blue-500 opacity-50" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active</p>
              <p className="text-2xl font-bold text-green-600">{stats.active}</p>
            </div>
            <Check className="w-10 h-10 text-green-500 opacity-50" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
            <AlertCircle className="w-10 h-10 text-yellow-500 opacity-50" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Suspended</p>
              <p className="text-2xl font-bold text-red-600">{stats.suspended}</p>
            </div>
            <Pause className="w-10 h-10 text-red-500 opacity-50" />
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search organizations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="text-gray-400 w-5 h-5" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
          <button
            onClick={fetchOrganizations}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
            Refresh
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 text-red-800">
            <AlertCircle className="w-5 h-5" />
            <p>{error}</p>
          </div>
        </div>
      )}

      {/* Organizations Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Organization
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Admin
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tier
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Users
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredOrganizations.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                    <Building2 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No organizations found</p>
                  </td>
                </tr>
              ) : (
                filteredOrganizations.map((org) => {
                  if (!org) return null;
                  
                  const orgStatus = org.status?.toLowerCase() || 'unknown';
                  const isLoading = actionLoading === org.id;
                  
                  return (
                    <tr key={org.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <p className="font-medium text-gray-900">
                            {org.name || 'Unnamed Organization'}
                          </p>
                          <p className="text-sm text-gray-500">
                            {org.subdomain 
                              ? `${org.subdomain}.yourdomain.com`
                              : 'No subdomain'
                            }
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-sm text-gray-900">
                          {org.adminEmail || 'N/A'}
                        </p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={org.status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <TierBadge tier={org.tier} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-900">
                            {org.userCount ?? 0}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* View Analytics */}
                          <button
                            onClick={() => handleViewAnalytics(org)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View Analytics"
                          >
                            <BarChart3 className="w-4 h-4" />
                          </button>

                          {/* Edit */}
                          <button
                            onClick={() => setEditingOrg(org)}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Edit Organization"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          {/* Status-specific actions */}
                          {orgStatus === 'pending' && (
                            <>
                              <button
                                onClick={() => handleApprove(org)}
                                disabled={isLoading}
                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                                title="Approve"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleReject(org)}
                                disabled={isLoading}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                title="Reject"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          )}

                          {orgStatus === 'active' && (
                            <button
                              onClick={() => handleSuspend(org)}
                              disabled={isLoading}
                              className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors disabled:opacity-50"
                              title="Suspend"
                            >
                              <Pause className="w-4 h-4" />
                            </button>
                          )}

                          {orgStatus === 'suspended' && (
                            <button
                              onClick={() => handleReactivate(org)}
                              disabled={isLoading}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                              title="Reactivate"
                            >
                              <Play className="w-4 h-4" />
                            </button>
                          )}

                          {/* Details */}
                          <button
                            onClick={() => {
                              setSelectedOrg(org);
                              setShowDetailsModal(true);
                            }}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <ChevronDown className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {editingOrg && (
        <EditModal
          organization={editingOrg}
          onClose={() => setEditingOrg(null)}
          onSave={handleSaveEdit}
        />
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedOrg && (
        <DetailsModal
          organization={selectedOrg}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedOrg(null);
          }}
        />
      )}
    </div>
  );
};

export default OrganizationsPage;

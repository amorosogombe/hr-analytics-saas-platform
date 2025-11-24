import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client/react/hooks';
import { AlertCircle, CheckCircle, Building2, Users, Activity, Search, Eye, Check, X, Loader } from 'lucide-react';
import { LIST_ALL_ORGANIZATIONS, GET_SYSTEM_METRICS } from '../graphql/queries';
import { APPROVE_ORGANIZATION, REJECT_ORGANIZATION, SUSPEND_ORGANIZATION } from '../graphql/mutations';
import { apolloClient } from '../lib/apolloClient';

const SuperAdminPortal = ({ user, signOut }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  // Fetch system metrics
  const { data: metricsData, loading: metricsLoading } = useQuery(GET_SYSTEM_METRICS, {
    client: apolloClient,
    fetchPolicy: 'network-only'
  });

  // Fetch organizations
  const { data: orgsData, loading: orgsLoading, refetch: refetchOrgs } = useQuery(LIST_ALL_ORGANIZATIONS, {
    client: apolloClient,
    variables: { 
      status: statusFilter === 'ALL' ? null : statusFilter,
      limit: 50 
    },
    fetchPolicy: 'network-only'
  });

  // Mutations
  const [approveOrg] = useMutation(APPROVE_ORGANIZATION, { client: apolloClient });
  const [rejectOrg] = useMutation(REJECT_ORGANIZATION, { client: apolloClient });
  const [suspendOrg] = useMutation(SUSPEND_ORGANIZATION, { client: apolloClient });

  const organizations = orgsData?.listAllOrganizations?.items || [];
  const metrics = metricsData?.getSystemMetrics || {};

  const filteredOrganizations = organizations.filter(org => 
    org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    org.subdomain.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleApproveOrganization = (orgId, action) => {
    setPendingAction({ orgId, action });
    setShowApprovalModal(true);
  };

  const confirmApproval = async () => {
    try {
      if (pendingAction.action === 'approve') {
        await approveOrg({ variables: { organizationId: pendingAction.orgId } });
        alert('Organization approved successfully!');
      } else if (pendingAction.action === 'reject') {
        await rejectOrg({ 
          variables: { 
            organizationId: pendingAction.orgId,
            reason: 'Not meeting requirements' 
          } 
        });
        alert('Organization rejected successfully!');
      }
      refetchOrgs();
    } catch (error) {
      console.error('Error:', error);
      alert('Error: ' + error.message);
    } finally {
      setShowApprovalModal(false);
      setPendingAction(null);
    }
  };

  const StatusBadge = ({ status }) => {
    const styles = {
      ACTIVE: 'bg-green-100 text-green-800 border-green-200',
      PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      SUSPENDED: 'bg-red-100 text-red-800 border-red-200'
    };
    
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${styles[status]}`}>
        {status}
      </span>
    );
  };

  const MetricCard = ({ icon: Icon, title, value, change, color }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value || 0}</p>
          {change && (
            <p className={`text-xs mt-1 ${change.positive ? 'text-green-600' : 'text-red-600'}`}>
              {change.positive ? '↑' : '↓'} {change.value}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );

  if (metricsLoading || orgsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Super Admin Portal</h1>
              <p className="text-sm text-gray-600 mt-1">Platform-wide administration and monitoring</p>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">{user?.attributes?.email}</span>
              <button
                onClick={signOut}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-8">
            {['overview', 'organizations', 'approvals'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricCard
                icon={Building2}
                title="Total Organizations"
                value={metrics.totalOrganizations}
                color="bg-blue-500"
              />
              <MetricCard
                icon={CheckCircle}
                title="Active Organizations"
                value={metrics.activeOrganizations}
                color="bg-green-500"
              />
              <MetricCard
                icon={AlertCircle}
                title="Pending Approvals"
                value={metrics.pendingApprovals}
                color="bg-yellow-500"
              />
              <MetricCard
                icon={Users}
                title="Total Users"
                value={metrics.totalUsers}
                color="bg-indigo-500"
              />
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">System Health</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
                  <Activity className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-green-900">API Status</p>
                    <p className="text-xs text-green-700">All systems operational</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <Activity className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">Storage Used</p>
                    <p className="text-xs text-blue-700">{metrics.storageUsed || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <Activity className="w-5 h-5 text-purple-600" />
                  <div>
                    <p className="text-sm font-medium text-purple-900">API Calls Today</p>
                    <p className="text-xs text-purple-700">{metrics.apiCallsToday || '0'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Organizations Tab */}
        {activeTab === 'organizations' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search organizations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="ALL">All Status</option>
                  <option value="ACTIVE">Active</option>
                  <option value="PENDING">Pending</option>
                  <option value="SUSPENDED">Suspended</option>
                </select>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Organization</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Subdomain</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Users</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Tier</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Created</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredOrganizations.map(org => (
                      <tr key={org.organizationId} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                              <Building2 className="w-5 h-5 text-indigo-600" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{org.name}</div>
                              <div className="text-xs text-gray-500">{org.adminEmail}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900 font-mono">{org.subdomain}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <StatusBadge status={org.status} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {org.userCount || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900 capitalize">{org.tier}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(org.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setSelectedOrg(org)}
                              className="text-indigo-600 hover:text-indigo-900"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {org.status === 'PENDING' && (
                              <>
                                <button
                                  onClick={() => handleApproveOrganization(org.organizationId, 'approve')}
                                  className="text-green-600 hover:text-green-900"
                                  title="Approve"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleApproveOrganization(org.organizationId, 'reject')}
                                  className="text-red-600 hover:text-red-900"
                                  title="Reject"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Approvals Tab */}
        {activeTab === 'approvals' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Pending Approvals</h2>
              {filteredOrganizations.filter(org => org.status === 'PENDING').length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                  <p className="text-gray-600">No pending approvals</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredOrganizations.filter(org => org.status === 'PENDING').map(org => (
                    <div key={org.organizationId} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900">{org.name}</h3>
                          <p className="text-sm text-gray-600 mt-1">Subdomain: {org.subdomain}</p>
                          <p className="text-sm text-gray-600">Admin: {org.adminEmail}</p>
                          <p className="text-sm text-gray-600">Tier: {org.tier}</p>
                          <p className="text-xs text-gray-500 mt-2">
                            Requested: {new Date(org.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApproveOrganization(org.organizationId, 'approve')}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                          >
                            <Check className="w-4 h-4" />
                            Approve
                          </button>
                          <button
                            onClick={() => handleApproveOrganization(org.organizationId, 'reject')}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
                          >
                            <X className="w-4 h-4" />
                            Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Approval Confirmation Modal */}
      {showApprovalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Confirm {pendingAction?.action === 'approve' ? 'Approval' : 'Rejection'}
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to {pendingAction?.action} this organization?
              {pendingAction?.action === 'approve' && ' This will provision all resources and send activation emails.'}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowApprovalModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmApproval}
                className={`px-4 py-2 rounded-lg text-white ${
                  pendingAction?.action === 'approve'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Organization Details Modal */}
      {selectedOrg && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">{selectedOrg.name}</h3>
                <p className="text-sm text-gray-600 mt-1">{selectedOrg.subdomain}</p>
              </div>
              <button
                onClick={() => setSelectedOrg(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <StatusBadge status={selectedOrg.status} />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Tier</p>
                  <p className="text-sm font-medium text-gray-900 capitalize">{selectedOrg.tier}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Admin Email</p>
                  <p className="text-sm font-medium text-gray-900">{selectedOrg.adminEmail}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Users</p>
                  <p className="text-sm font-medium text-gray-900">{selectedOrg.userCount || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Data Sources</p>
                  <p className="text-sm font-medium text-gray-900">
                    {selectedOrg.dataSourcesConfigured ? 'Configured' : 'Not Configured'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Created</p>
                  <p className="text-sm font-medium text-gray-900">
{new Date(selectedOrg.createdAt).toLocaleString()}
</p>
</div>
</div>
</div>
</div>
</div>
)}
</div>
);
};
export default SuperAdminPortal;

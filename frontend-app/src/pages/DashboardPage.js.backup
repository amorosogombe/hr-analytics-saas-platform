import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { fetchAuthSession } from 'aws-amplify/auth';
import { APP_CONFIG } from '../aws-config';
import axios from 'axios';
import { embedDashboard } from 'amazon-quicksight-embedding-sdk';

export default function DashboardPage() {
  const { user, canViewAllMetrics } = useAuth();
  const [dashboards, setDashboards] = useState([]);
  const [selectedDashboard, setSelectedDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [embedUrl, setEmbedUrl] = useState(null);
  const [permissions, setPermissions] = useState(null);
  const dashboardContainerRef = useRef(null);

  useEffect(() => {
    loadDashboards();
  }, []);

  useEffect(() => {
    if (selectedDashboard) {
      loadDashboardEmbed();
    }
  }, [selectedDashboard]);

  const loadDashboards = async () => {
    try {
      setLoading(true);
      const session = await fetchAuthSession();
      const response = await axios.get(`${APP_CONFIG.apiUrl}/dashboards/list`, {
        headers: {
          Authorization: `Bearer ${session.tokens.idToken}`,
        },
      });

      setDashboards(response.data.dashboards);
      if (response.data.dashboards.length > 0) {
        setSelectedDashboard(response.data.dashboards[0]);
      }
    } catch (err) {
      console.error('Error loading dashboards:', err);
      setError('Failed to load dashboards');
    } finally {
      setLoading(false);
    }
  };

  const loadDashboardEmbed = async () => {
    try {
      setLoading(true);
      setError('');
      
      const session = await fetchAuthSession();
      const response = await axios.post(
        `${APP_CONFIG.apiUrl}/dashboards/embed`,
        { dashboardId: selectedDashboard.id },
        {
          headers: {
            Authorization: `Bearer ${session.tokens.idToken}`,
          },
        }
      );

      setEmbedUrl(response.data.embedUrl);
      setPermissions(response.data.permissions);

      // Embed QuickSight dashboard
      if (dashboardContainerRef.current) {
        const embedOptions = {
          url: response.data.embedUrl,
          container: dashboardContainerRef.current,
          height: '800px',
          width: '100%',
          locale: 'en-US',
          footerPaddingEnabled: true,
        };

        embedDashboard(embedOptions);
      }
    } catch (err) {
      console.error('Error loading dashboard embed:', err);
      if (err.response?.data?.code === 'QUICKSIGHT_USER_NOT_FOUND') {
        setError('Your QuickSight user account needs to be set up. Please contact your administrator.');
      } else {
        setError('Failed to load dashboard. ' + (err.response?.data?.error || err.message));
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading && !embedUrl) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading dashboards...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 rounded-xl shadow-lg">
        <h1 className="text-3xl font-bold text-white mb-2">Analytics Dashboard</h1>
        <p className="text-purple-100">
          Welcome back, {user?.fullName || user?.email}
        </p>
        {user && (
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="px-3 py-1 bg-white/20 rounded-full text-sm text-white">
              {user.role || 'User'}
            </span>
            <span className="px-3 py-1 bg-white/20 rounded-full text-sm text-white">
              {user.organizationId || 'No Organization'}
            </span>
          </div>
        )}
      </div>

      {/* Permissions Info */}
      {permissions && (
        <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
          <h3 className="text-sm font-semibold text-slate-300 mb-2">Your Dashboard Permissions:</h3>
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${permissions.canView === 'all' ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
              <span className="text-sm text-slate-400">
                View: {permissions.canView === 'all' ? 'All Metrics' : 'Own Metrics Only'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${permissions.canComment === 'all' ? 'bg-green-500' : permissions.canComment === 'own' ? 'bg-yellow-500' : 'bg-red-500'}`}></span>
              <span className="text-sm text-slate-400">
                Comment: {permissions.canComment === 'all' ? 'All Metrics' : permissions.canComment === 'own' ? 'Own Metrics' : 'None'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${permissions.canApprove === 'all' ? 'bg-green-500' : 'bg-red-500'}`}></span>
              <span className="text-sm text-slate-400">
                Approve Comments: {permissions.canApprove === 'all' ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${permissions.canDelete === 'all' ? 'bg-green-500' : 'bg-red-500'}`}></span>
              <span className="text-sm text-slate-400">
                Delete Comments: {permissions.canDelete === 'all' ? 'Yes' : 'No'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Dashboard Selector */}
      {dashboards.length > 1 && (
        <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
          <label className="block text-sm font-medium text-slate-300 mb-2">Select Dashboard:</label>
          <select
            value={selectedDashboard?.id || ''}
            onChange={(e) => {
              const dashboard = dashboards.find(d => d.id === e.target.value);
              setSelectedDashboard(dashboard);
            }}
            className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            {dashboards.map(dashboard => (
              <option key={dashboard.id} value={dashboard.id}>
                {dashboard.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/50 p-4 rounded-lg">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-red-500 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-red-400 font-semibold">Error Loading Dashboard</p>
              <p className="text-red-300 text-sm mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* QuickSight Dashboard Container */}
      {selectedDashboard && !error && (
        <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
          <div className="p-4 border-b border-slate-700">
            <h2 className="text-xl font-semibold text-white">{selectedDashboard.name}</h2>
            {selectedDashboard.description && (
              <p className="text-slate-400 text-sm mt-1">{selectedDashboard.description}</p>
            )}
          </div>
          <div 
            ref={dashboardContainerRef}
            className="w-full"
            style={{ minHeight: '800px' }}
          />
        </div>
      )}

      {/* Help Text */}
      {!canViewAllMetrics() && (
        <div className="bg-blue-500/10 border border-blue-500/50 p-4 rounded-lg">
          <p className="text-blue-400 text-sm">
            <strong>Note:</strong> As an employee, you can only view and comment on your own metrics. 
            Contact your supervisor or HR manager for access to additional metrics.
          </p>
        </div>
      )}
    </div>
  );
}

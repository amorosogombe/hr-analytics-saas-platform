import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { fetchAuthSession } from 'aws-amplify/auth';
import { APP_CONFIG } from '../aws-config';
import axios from 'axios';

export default function DashboardPage() {
  const { user } = useAuth();
  const [dashboards, setDashboards] = useState([]);
  const [selectedDashboard, setSelectedDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const dashboardContainerRef = useRef(null);
  const embeddedDashboardRef = useRef(null);

  useEffect(() => {
    loadDashboards();
  }, []);

  useEffect(() => {
    if (selectedDashboard) {
      loadDashboardEmbed();
    }
    
    // Cleanup previous embed when changing dashboards
    return () => {
      if (dashboardContainerRef.current) {
        dashboardContainerRef.current.innerHTML = '';
      }
    };
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

      console.log('Dashboards loaded:', response.data);
      setDashboards(response.data.dashboards);
      if (response.data.dashboards.length > 0) {
        setSelectedDashboard(response.data.dashboards[0]);
      }
    } catch (err) {
      console.error('Error loading dashboards:', err);
      setError('Failed to load dashboards: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const loadDashboardEmbed = async () => {
    try {
      setLoading(true);
      setError('');

      // Clear previous embed
      if (dashboardContainerRef.current) {
        dashboardContainerRef.current.innerHTML = '';
      }

      const session = await fetchAuthSession();
      
      // Use the new GET endpoint with dashboard key
      const response = await axios.get(
        `${APP_CONFIG.apiUrl}/dashboards/embed-url?dashboard=${selectedDashboard.key}`,
        {
          headers: {
            Authorization: `Bearer ${session.tokens.idToken}`,
          },
        }
      );

      console.log('Embed URL response:', response.data);

      // Check if QuickSight SDK is loaded
      if (!window.QuickSightEmbedding) {
        throw new Error('QuickSight SDK not loaded. Please refresh the page.');
      }

      // Embed QuickSight dashboard using the SDK
      if (dashboardContainerRef.current) {
        const options = {
          url: response.data.embedUrl,
          container: dashboardContainerRef.current,
          height: '800px',
          width: '100%',
          scrolling: 'no',
          footerPaddingEnabled: true,
        };

        console.log('Embedding dashboard with options:', options);
        const dashboard = window.QuickSightEmbedding.embedDashboard(options);
        embeddedDashboardRef.current = dashboard;

        // Add event listeners
        dashboard.on('error', (error) => {
          console.error('Dashboard embed error:', error);
          setError('Dashboard failed to load: ' + error.message);
        });

        dashboard.on('load', () => {
          console.log('Dashboard loaded successfully');
        });
      }
    } catch (err) {
      console.error('Error loading dashboard embed:', err);
      setError('Failed to load dashboard: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  if (loading && dashboards.length === 0) {
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
            {user.organizationId && (
              <span className="px-3 py-1 bg-white/20 rounded-full text-sm text-white">
                {user.organizationId}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Dashboard Selector */}
      {dashboards.length > 1 && (
        <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
          <label className="block text-sm font-medium text-slate-300 mb-2">Select Dashboard:</label>
          <select
            value={selectedDashboard?.key || ''}
            onChange={(e) => {
              const dashboard = dashboards.find(d => d.key === e.target.value);
              setSelectedDashboard(dashboard);
            }}
            className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            {dashboards.map(dashboard => (
              <option key={dashboard.key} value={dashboard.key}>
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

      {/* Loading Indicator */}
      {loading && selectedDashboard && (
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mr-4"></div>
            <p className="text-slate-400">Loading {selectedDashboard.name}...</p>
          </div>
        </div>
      )}

      {/* QuickSight Dashboard Container */}
      {selectedDashboard && !error && (
        <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
          <div className="p-4 border-b border-slate-700">
            <h2 className="text-xl font-semibold text-white">{selectedDashboard.name}</h2>
          </div>
          <div
            ref={dashboardContainerRef}
            className="w-full"
            style={{ minHeight: '800px', backgroundColor: '#1e293b' }}
          />
        </div>
      )}

      {/* Help Text */}
      {dashboards.length === 0 && !loading && (
        <div className="bg-yellow-500/10 border border-yellow-500/50 p-4 rounded-lg">
          <p className="text-yellow-400 text-sm">
            <strong>No Dashboards Available:</strong> You don't have access to any dashboards yet.
            Contact your administrator for access.
          </p>
        </div>
      )}
    </div>
  );
}

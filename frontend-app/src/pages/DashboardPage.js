import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { APP_CONFIG } from '../aws-config';
import { useNavigate } from 'react-router-dom';
import { fetchAuthSession } from 'aws-amplify/auth';

function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dashboards, setDashboards] = useState([]);
  const [selectedDashboard, setSelectedDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [embeddedDashboard, setEmbeddedDashboard] = useState(null);
  const [authToken, setAuthToken] = useState(null);

  // Get auth token directly from Amplify
  useEffect(() => {
    const getAuthToken = async () => {
      try {
        console.log('Getting auth token from Amplify...');
        
        if (!user) {
          console.log('No user found, redirecting to login...');
          navigate('/login');
          return;
        }

        // Get current session using Amplify v6 syntax
        const session = await fetchAuthSession();
        const token = session.tokens?.idToken?.toString();
        
        if (!token) {
          throw new Error('No auth token in session');
        }
        
        console.log('✅ Auth token retrieved successfully');
        setAuthToken(token);
        
      } catch (err) {
        console.error('Failed to get auth token:', err);
        setError('Authentication failed. Please login again.');
        setTimeout(() => navigate('/login'), 2000);
      }
    };

    getAuthToken();
  }, [user, navigate]);

  // Load dashboards once we have the token
  useEffect(() => {
    if (authToken) {
      loadDashboards();
    }
  }, [authToken]);

  useEffect(() => {
    if (selectedDashboard && authToken) {
      embedDashboard(selectedDashboard);
    }
  }, [selectedDashboard, authToken]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (embeddedDashboard) {
        console.log('Cleaning up embedded dashboard');
      }
    };
  }, [embeddedDashboard]);

  const loadDashboards = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!authToken) {
        throw new Error('No authentication token available');
      }

      console.log('Fetching dashboards from API...');
      
      const response = await fetch(`${APP_CONFIG.apiUrl}/dashboards/list`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to load dashboards: ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Dashboards loaded:', data);
      
      setDashboards(data.dashboards || []);
      
      // Auto-select first dashboard
      if (data.dashboards && data.dashboards.length > 0) {
        setSelectedDashboard(data.dashboards[0]);
      } else {
        setError('No dashboards available');
      }
    } catch (err) {
      console.error('❌ Error loading dashboards:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const embedDashboard = async (dashboard) => {
    try {
      setError(null);
      
      console.log('Starting dashboard embed for:', dashboard.name);
      
      // Check if QuickSight SDK is loaded
      if (!window.QuickSightEmbedding) {
        throw new Error('QuickSight SDK not loaded. Please refresh the page.');
      }

      // Check if createEmbeddingContext exists (v2 API)
      if (!window.QuickSightEmbedding.createEmbeddingContext) {
        throw new Error('QuickSight SDK v2 API not available');
      }

      if (!authToken) {
        throw new Error('No authentication token available');
      }

      console.log('Fetching embed URL for dashboard:', dashboard.key);
      
      // Fetch embed URL
      const response = await fetch(
        `${APP_CONFIG.apiUrl}/dashboards/embed-url?dashboard=${dashboard.key}`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to get embed URL: ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Embed URL received:', data.dashboardId);

      if (!data.embedUrl) {
        throw new Error('No embed URL in response');
      }

      // Clear previous dashboard
      const container = document.getElementById('dashboard-container');
      if (!container) {
        throw new Error('Dashboard container not found');
      }
      container.innerHTML = '';

      // Create embedding context (v2 API) - MUST AWAIT!
      console.log('Creating QuickSight embedding context...');
      const embeddingContext = await window.QuickSightEmbedding.createEmbeddingContext({
        onChange: (changeEvent) => {
          console.log('Dashboard change event:', changeEvent);
          if (changeEvent.eventLevel === 'ERROR') {
            console.error('Dashboard error:', changeEvent);
            setError(`Dashboard error: ${changeEvent.message || 'Unknown error'}`);
          }
        }
      });

      // Embed dashboard options
      const frameOptions = {
        url: data.embedUrl,
        container: container,
        height: '800px',
        width: '100%',
        scrolling: 'no',
      };

      const contentOptions = {
        toolbarOptions: {
          export: false,
          undoRedo: false,
          reset: false,
        },
        attributionOptions: {
          overlayContent: false,
        },
      };

      console.log('Embedding dashboard...');

      // Use v2 API - embedDashboard returns the experience frame
      const dashboardExperience = await embeddingContext.embedDashboard(
        frameOptions,
        contentOptions
      );
      
      console.log('✅ Dashboard embedded successfully!');
      setEmbeddedDashboard(dashboardExperience);

    } catch (err) {
      console.error('❌ Error loading dashboard embed:', err);
      setError(err.message || 'Failed to load dashboard');
    }
  };

  // Show loading while getting auth token
  if (!authToken) {
    return (
      <div className="flex items-center justify-center h-64 bg-white">
        <div className="space-y-4 text-center">
          <div className="text-gray-700">Initializing authentication...</div>
          {error && (
            <div className="text-red-600 text-sm">{error}</div>
          )}
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-white">
        <div className="text-gray-700">Loading dashboards...</div>
      </div>
    );
  }

  if (error && dashboards.length === 0) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 m-4">
        <h3 className="text-red-800 font-semibold mb-2">Error</h3>
        <p className="text-red-600 mb-4">{error}</p>
        <div className="flex gap-2">
          <button
            onClick={loadDashboards}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
          <button
            onClick={() => navigate('/login')}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  if (dashboards.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 m-4">
        <h3 className="text-yellow-800 font-semibold mb-2">No Dashboards Available</h3>
        <p className="text-yellow-600">
          No dashboards are configured for your account. Please contact your administrator.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow">
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          
          {dashboards.length > 1 && (
            <select
              value={selectedDashboard?.key || ''}
              onChange={(e) => {
                const dashboard = dashboards.find(d => d.key === e.target.value);
                setSelectedDashboard(dashboard);
              }}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {dashboards.map((dashboard) => (
                <option key={dashboard.key} value={dashboard.key}>
                  {dashboard.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {error && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-yellow-800 text-sm">{error}</p>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-lg p-2">
          <div 
            id="dashboard-container" 
            className="w-full bg-white"
            style={{ minHeight: '800px' }}
          />
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;

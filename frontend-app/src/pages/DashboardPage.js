import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { APP_CONFIG } from '../aws-config';  // ✅ KEEP THIS

function DashboardPage() {
  const { user } = useAuth();
  const [dashboards, setDashboards] = useState([]);
  const [selectedDashboard, setSelectedDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [embeddedDashboard, setEmbeddedDashboard] = useState(null);

  useEffect(() => {
    loadDashboards();
  }, []);

  useEffect(() => {
    if (selectedDashboard) {
      embedDashboard(selectedDashboard);
    }
  }, [selectedDashboard]);

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
      const token = user.signInUserSession.idToken.jwtToken;
      
      const response = await fetch(`${APP_CONFIG.apiUrl}/dashboards/list`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to load dashboards: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Dashboards loaded:', data);
      
      setDashboards(data.dashboards || []);
      
      // Auto-select first dashboard
      if (data.dashboards && data.dashboards.length > 0) {
        setSelectedDashboard(data.dashboards[0]);
      }
    } catch (err) {
      console.error('Error loading dashboards:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const embedDashboard = async (dashboard) => {
    try {
      setError(null);
      
      // Check if QuickSight SDK is loaded
      if (!window.QuickSightEmbedding) {
        throw new Error('QuickSight SDK not loaded. Please refresh the page.');
      }

      // Check if createEmbeddingContext exists (v2 API)
      if (!window.QuickSightEmbedding.createEmbeddingContext) {
        throw new Error('QuickSight SDK v2 API not available');
      }

      const token = user.signInUserSession.idToken.jwtToken;
      
      // Fetch embed URL
      const response = await fetch(
        `${APP_CONFIG.apiUrl}/dashboards/embed-url?dashboard=${dashboard.key}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to get embed URL: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Embed URL response:', data);

      if (!data.embedUrl) {
        throw new Error('No embed URL in response');
      }

      // Clear previous dashboard
      const container = document.getElementById('dashboard-container');
      if (container) {
        container.innerHTML = '';
      }

      // Create embedding context (v2 API)
      const embeddingContext = window.QuickSightEmbedding.createEmbeddingContext();

      // Embed dashboard options
      const options = {
        url: data.embedUrl,
        container: container,
        height: '800px',
        width: '100%',
        scrolling: 'no',
        footerPaddingEnabled: true,
        printEnabled: false,
        undoRedoDisabled: false,
        resetDisabled: false
      };

      console.log('Embedding dashboard with options:', options);

      // Use v2 API - embedDashboard returns a Promise
      const dashboard = await embeddingContext.embedDashboard(options);
      
      console.log('Dashboard embedded successfully:', dashboard);
      setEmbeddedDashboard(dashboard);

      // Add event listeners
      dashboard.on('error', (event) => {
        console.error('Dashboard error event:', event);
        setError('Error loading dashboard. Please try again.');
      });

      dashboard.on('CONTENT_LOADED', () => {
        console.log('Dashboard content loaded');
      });

    } catch (err) {
      console.error('Error loading dashboard embed:', err);
      setError(err.message || 'Failed to load dashboard');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading dashboards...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h3 className="text-red-800 font-semibold mb-2">Error</h3>
        <p className="text-red-600">{error}</p>
        <button
          onClick={loadDashboards}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
        
        {dashboards.length > 1 && (
          <select
            value={selectedDashboard?.key || ''}
            onChange={(e) => {
              const dashboard = dashboards.find(d => d.key === e.target.value);
              setSelectedDashboard(dashboard);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {dashboards.map((dashboard) => (
              <option key={dashboard.key} value={dashboard.key}>
                {dashboard.name}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-lg p-2">
        <div 
          id="dashboard-container" 
          className="w-full"
          style={{ minHeight: '800px' }}
        />
      </div>
    </div>
  );
}

export default DashboardPage;

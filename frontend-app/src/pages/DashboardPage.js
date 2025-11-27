import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { fetchAuthSession } from 'aws-amplify/auth';
import { APP_CONFIG } from '../aws-config';
import axios from 'axios';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

// Sample data for demo
const productivityData = [
  { month: 'Jan', productivity: 85, hours: 160, tasks: 45 },
  { month: 'Feb', productivity: 88, hours: 152, tasks: 52 },
  { month: 'Mar', productivity: 92, hours: 168, tasks: 58 },
  { month: 'Apr', productivity: 87, hours: 160, tasks: 48 },
  { month: 'May', productivity: 95, hours: 172, tasks: 62 },
  { month: 'Jun', productivity: 93, hours: 168, tasks: 59 },
];

const taskDistribution = [
  { name: 'Completed', value: 245, color: '#10b981' },
  { name: 'In Progress', value: 34, color: '#f59e0b' },
  { name: 'Pending', value: 12, color: '#6366f1' },
];

const weeklyActivity = [
  { day: 'Mon', active: 8.5, idle: 0.5 },
  { day: 'Tue', active: 8.2, idle: 0.8 },
  { day: 'Wed', active: 9.0, idle: 0 },
  { day: 'Thu', active: 7.8, idle: 1.2 },
  { day: 'Fri', active: 8.3, idle: 0.7 },
];

export default function DashboardPage() {
  const { user, canViewAllMetrics } = useAuth();
  const [dashboards, setDashboards] = useState([]);
  const [selectedDashboard, setSelectedDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [permissions, setPermissions] = useState(null);
  const [quicksightAvailable, setQuicksightAvailable] = useState(false);

  useEffect(() => {
    loadDashboards();
  }, []);

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
      setPermissions(response.data.dashboards[0]?.permissions);
      
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

  if (loading) {
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
              {user.role || 'Employee'}
            </span>
            <span className="px-3 py-1 bg-white/20 rounded-full text-sm text-white">
              {user.organizationName || user.organizationId || 'No Organization'}
            </span>
          </div>
        )}
      </div>

      {/* QuickSight Setup Notice */}
      <div className="bg-blue-500/10 border border-blue-500/50 p-4 rounded-lg">
        <div className="flex items-start">
          <svg className="w-5 h-5 text-blue-500 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-blue-400 font-semibold">Demo Dashboard Mode</p>
            <p className="text-blue-300 text-sm mt-1">
              QuickSight integration is pending setup. Below are sample visualizations to demonstrate the dashboard functionality.
              Contact your administrator to configure QuickSight for live data.
            </p>
          </div>
        </div>
      </div>

      {/* Permissions Info */}
      {permissions && (
        <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
          <h3 className="text-sm font-semibold text-slate-300 mb-2">Your Dashboard Permissions:</h3>
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${permissions.canView ? 'bg-green-500' : 'bg-red-500'}`}></span>
              <span className="text-sm text-slate-400">
                View: {canViewAllMetrics() ? 'All Metrics' : 'Own Metrics Only'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${permissions.canComment ? 'bg-green-500' : 'bg-red-500'}`}></span>
              <span className="text-sm text-slate-400">
                Comment: {permissions.canComment ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${permissions.canApprove ? 'bg-green-500' : 'bg-red-500'}`}></span>
              <span className="text-sm text-slate-400">
                Approve Comments: {permissions.canApprove ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${permissions.canDelete ? 'bg-green-500' : 'bg-red-500'}`}></span>
              <span className="text-sm text-slate-400">
                Delete Comments: {permissions.canDelete ? 'Yes' : 'No'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Dashboard Selector */}
      {dashboards.length > 0 && (
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
          {selectedDashboard && (
            <p className="text-slate-400 text-sm mt-2">{selectedDashboard.description}</p>
          )}
        </div>
      )}

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-purple-500 to-purple-700 p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Productivity Score</p>
              <p className="text-white text-3xl font-bold mt-2">93%</p>
              <p className="text-purple-200 text-xs mt-1">↑ 5% from last month</p>
            </div>
            <div className="bg-white/20 p-3 rounded-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-700 p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Tasks Completed</p>
              <p className="text-white text-3xl font-bold mt-2">245</p>
              <p className="text-green-200 text-xs mt-1">This month</p>
            </div>
            <div className="bg-white/20 p-3 rounded-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-700 p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Active Hours</p>
              <p className="text-white text-3xl font-bold mt-2">168</p>
              <p className="text-blue-200 text-xs mt-1">This month</p>
            </div>
            <div className="bg-white/20 p-3 rounded-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-700 p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">In Progress</p>
              <p className="text-white text-3xl font-bold mt-2">34</p>
              <p className="text-orange-200 text-xs mt-1">Active tasks</p>
            </div>
            <div className="bg-white/20 p-3 rounded-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Productivity Trend */}
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
          <h3 className="text-xl font-semibold text-white mb-4">Productivity Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={productivityData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="month" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }}
                labelStyle={{ color: '#e2e8f0' }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="productivity"
                stroke="#a855f7"
                strokeWidth={2}
                name="Productivity %"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Task Distribution */}
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
          <h3 className="text-xl font-semibold text-white mb-4">Task Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={taskDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => `${entry.name}: ${entry.value}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {taskDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }}
                labelStyle={{ color: '#e2e8f0' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Weekly Activity */}
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
          <h3 className="text-xl font-semibold text-white mb-4">Weekly Activity</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={weeklyActivity}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="day" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }}
                labelStyle={{ color: '#e2e8f0' }}
              />
              <Legend />
              <Bar dataKey="active" fill="#10b981" name="Active Hours" />
              <Bar dataKey="idle" fill="#ef4444" name="Idle Hours" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly Tasks */}
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
          <h3 className="text-xl font-semibold text-white mb-4">Monthly Tasks</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={productivityData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="month" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }}
                labelStyle={{ color: '#e2e8f0' }}
              />
              <Legend />
              <Bar dataKey="tasks" fill="#6366f1" name="Tasks Completed" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Help Text */}
      {!canViewAllMetrics() && (
        <div className="bg-purple-500/10 border border-purple-500/50 p-4 rounded-lg">
          <p className="text-purple-400 text-sm">
            <strong>Note:</strong> As an employee, you can view and comment on your own metrics.
            The data shown above represents your personal productivity analytics. Contact your supervisor
            or HR manager for questions about your performance metrics.
          </p>
        </div>
      )}
    </div>
  );
}

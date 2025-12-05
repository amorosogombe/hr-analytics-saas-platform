// DashboardPage.js - Role-based dashboard content
// Place this in: frontend-app/src/pages/DashboardPage.js

import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Users, 
  Building2, 
  Activity,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  MessageSquare,
  Settings,
  Eye
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

// ============================================
// MOCK DATA (inline for demo - normally imported)
// ============================================
const dashboardData = {
  super_admin: {
    stats: [
      { label: 'Total Organizations', value: 12, icon: Building2, color: 'blue' },
      { label: 'Active Organizations', value: 10, icon: CheckCircle, color: 'green' },
      { label: 'Pending Approvals', value: 2, icon: AlertCircle, color: 'yellow' },
      { label: 'Total Users', value: 1247, icon: Users, color: 'purple' }
    ],
    chartData: [
      { name: 'Jan', orgs: 4, users: 320 },
      { name: 'Feb', orgs: 5, users: 480 },
      { name: 'Mar', orgs: 7, users: 650 },
      { name: 'Apr', orgs: 9, users: 890 },
      { name: 'May', orgs: 12, users: 1247 }
    ]
  },
  org_admin: {
    stats: [
      { label: 'Total Employees', value: 156, icon: Users, color: 'blue' },
      { label: 'Active Today', value: 142, icon: Activity, color: 'green' },
      { label: 'Pending Approvals', value: 3, icon: AlertCircle, color: 'yellow' },
      { label: 'Avg Productivity', value: '84%', icon: TrendingUp, color: 'purple' }
    ],
    departments: [
      { name: 'Engineering', employees: 45, productivity: 88 },
      { name: 'Sales', employees: 32, productivity: 82 },
      { name: 'Marketing', employees: 24, productivity: 79 },
      { name: 'HR', employees: 12, productivity: 85 },
      { name: 'Finance', employees: 18, productivity: 91 }
    ]
  },
  hr_manager: {
    stats: [
      { label: 'Total Employees', value: 156, icon: Users, color: 'blue' },
      { label: 'Avg Productivity', value: '84%', icon: TrendingUp, color: 'green' },
      { label: 'Pending Comments', value: 8, icon: MessageSquare, color: 'yellow' },
      { label: 'Active Time Avg', value: '7h 12m', icon: Clock, color: 'purple' }
    ],
    weeklyTrend: [
      { day: 'Mon', score: 82 },
      { day: 'Tue', score: 85 },
      { day: 'Wed', score: 88 },
      { day: 'Thu', score: 84 },
      { day: 'Fri', score: 79 }
    ]
  },
  supervisor: {
    stats: [
      { label: 'Team Size', value: 8, icon: Users, color: 'blue' },
      { label: 'Team Productivity', value: '86%', icon: TrendingUp, color: 'green' },
      { label: 'Tasks Today', value: 12, icon: CheckCircle, color: 'yellow' },
      { label: 'Pending Tasks', value: 24, icon: Clock, color: 'purple' }
    ],
    teamMembers: [
      { name: 'Alice Johnson', productivity: 87, status: 'active' },
      { name: 'David Chen', productivity: 92, status: 'active' },
      { name: 'Emma Wilson', productivity: 81, status: 'active' },
      { name: 'Michael Lee', productivity: 89, status: 'break' }
    ]
  },
  employee: {
    stats: [
      { label: 'My Productivity', value: '87%', icon: TrendingUp, color: 'blue' },
      { label: 'Active Time', value: '7h 23m', icon: Clock, color: 'green' },
      { label: 'Tasks Completed', value: 3, icon: CheckCircle, color: 'yellow' },
      { label: 'In Progress', value: 2, icon: Activity, color: 'purple' }
    ],
    weeklyData: [
      { day: 'Mon', score: 82, hours: 7.5 },
      { day: 'Tue', score: 88, hours: 8.0 },
      { day: 'Wed', score: 91, hours: 8.2 },
      { day: 'Thu', score: 85, hours: 7.8 },
      { day: 'Fri', score: 87, hours: 7.4 }
    ],
    tasks: [
      { title: 'Update dashboard UI', status: 'completed' },
      { title: 'Fix responsive layout', status: 'completed' },
      { title: 'Review PR #234', status: 'in_progress' },
      { title: 'Implement dark mode', status: 'in_progress' }
    ]
  }
};

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444'];

// ============================================
// STAT CARD COMPONENT
// ============================================
const StatCard = ({ stat }) => {
  const Icon = stat.icon;
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    purple: 'bg-purple-100 text-purple-600'
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{stat.label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[stat.color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
};

// ============================================
// SUPER ADMIN DASHBOARD
// ============================================
const SuperAdminDashboard = ({ data }) => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {data.stats.map((stat, i) => <StatCard key={i} stat={stat} />)}
    </div>
    
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Platform Growth</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data.chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip />
            <Line yAxisId="left" type="monotone" dataKey="orgs" stroke="#3B82F6" name="Organizations" />
            <Line yAxisId="right" type="monotone" dataKey="users" stroke="#10B981" name="Users" />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        <div className="space-y-4">
          {[
            { type: 'New org request', org: 'Global Dynamics', time: '2 hours ago', icon: Building2 },
            { type: 'User signup', org: 'TechStart Inc', time: '4 hours ago', icon: Users },
            { type: 'Org approved', org: 'FinServ LLC', time: '1 day ago', icon: CheckCircle }
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <item.icon className="w-5 h-5 text-gray-500" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{item.type}</p>
                <p className="text-xs text-gray-500">{item.org}</p>
              </div>
              <span className="text-xs text-gray-400">{item.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

// ============================================
// ORG ADMIN DASHBOARD
// ============================================
const OrgAdminDashboard = ({ data }) => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {data.stats.map((stat, i) => <StatCard key={i} stat={stat} />)}
    </div>
    
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Department Performance</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data.departments}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="productivity" fill="#3B82F6" name="Productivity %" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Sources</h3>
        <div className="space-y-4">
          {[
            { name: 'Odoo', status: 'Connected', lastSync: '10 min ago', records: '15,420' },
            { name: 'Controlio', status: 'Connected', lastSync: '5 min ago', records: '89,234' }
          ].map((source, i) => (
            <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">{source.name}</p>
                <p className="text-sm text-gray-500">Last sync: {source.lastSync}</p>
              </div>
              <div className="text-right">
                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">{source.status}</span>
                <p className="text-sm text-gray-500 mt-1">{source.records} records</p>
              </div>
            </div>
          ))}
        </div>
        
        <h4 className="text-md font-semibold text-gray-900 mt-6 mb-3">Pending User Approvals</h4>
        <div className="space-y-2">
          {[
            { name: 'Mark Thompson', email: 'mark.t@acme.com', role: 'Employee' },
            { name: 'Lisa Wang', email: 'lisa.w@acme.com', role: 'Supervisor' }
          ].map((user, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <div>
                <p className="font-medium text-gray-900">{user.name}</p>
                <p className="text-xs text-gray-500">{user.email} • {user.role}</p>
              </div>
              <div className="flex gap-2">
                <button className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600">Approve</button>
                <button className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600">Reject</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

// ============================================
// HR MANAGER DASHBOARD
// ============================================
const HRManagerDashboard = ({ data }) => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {data.stats.map((stat, i) => <StatCard key={i} stat={stat} />)}
    </div>
    
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Productivity Trend</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data.weeklyTrend}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" />
            <YAxis domain={[70, 100]} />
            <Tooltip />
            <Line type="monotone" dataKey="score" stroke="#10B981" strokeWidth={2} name="Productivity %" />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Comment Approvals</h3>
        <div className="space-y-3">
          {[
            { employee: 'Alice Johnson', comment: 'Great progress on Q4 goals', author: 'Bob Martinez' },
            { employee: 'David Chen', comment: 'Exceeded sprint targets', author: 'Bob Martinez' }
          ].map((item, i) => (
            <div key={i} className="p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-gray-900">{item.employee}</p>
                  <p className="text-sm text-gray-600 mt-1">"{item.comment}"</p>
                  <p className="text-xs text-gray-400 mt-1">By {item.author}</p>
                </div>
                <div className="flex gap-2">
                  <button className="p-2 bg-green-100 text-green-600 rounded hover:bg-green-200">
                    <CheckCircle className="w-4 h-4" />
                  </button>
                  <button className="p-2 bg-red-100 text-red-600 rounded hover:bg-red-200">
                    <AlertCircle className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

// ============================================
// SUPERVISOR DASHBOARD
// ============================================
const SupervisorDashboard = ({ data }) => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {data.stats.map((stat, i) => <StatCard key={i} stat={stat} />)}
    </div>
    
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Team Members - Frontend Team</h3>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Name</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Status</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Productivity</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.teamMembers.map((member, i) => (
              <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4">
                  <p className="font-medium text-gray-900">{member.name}</p>
                </td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    member.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {member.status}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${member.productivity >= 85 ? 'bg-green-500' : 'bg-yellow-500'}`}
                        style={{ width: `${member.productivity}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-600">{member.productivity}%</span>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className="flex gap-2">
                    <button className="p-1 text-blue-600 hover:bg-blue-50 rounded">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button className="p-1 text-gray-600 hover:bg-gray-100 rounded">
                      <MessageSquare className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

// ============================================
// EMPLOYEE DASHBOARD (Personal metrics only)
// ============================================
const EmployeeDashboard = ({ data, user }) => (
  <div className="space-y-6">
    <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
      <h2 className="text-2xl font-bold">Welcome back, {user?.name || 'Employee'}!</h2>
      <p className="text-blue-100 mt-1">Here's your personal productivity overview</p>
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {data.stats.map((stat, i) => <StatCard key={i} stat={stat} />)}
    </div>
    
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">My Weekly Performance</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data.weeklyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="score" fill="#3B82F6" name="Productivity %" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">My Tasks</h3>
        <div className="space-y-3">
          {data.tasks.map((task, i) => (
            <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className={`w-3 h-3 rounded-full ${
                task.status === 'completed' ? 'bg-green-500' : 'bg-yellow-500'
              }`} />
              <span className="flex-1 text-gray-700">{task.title}</span>
              <span className={`text-xs px-2 py-1 rounded ${
                task.status === 'completed' 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-yellow-100 text-yellow-700'
              }`}>
                {task.status === 'completed' ? 'Done' : 'In Progress'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
    
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
      <div className="flex items-start gap-3">
        <Activity className="w-5 h-5 text-blue-600 mt-0.5" />
        <div>
          <p className="font-medium text-blue-900">Your metrics are private</p>
          <p className="text-sm text-blue-700 mt-1">
            Only your supervisor and HR can view your detailed metrics. You have full access to your own data.
          </p>
        </div>
      </div>
    </div>
  </div>
);

// ============================================
// MAIN DASHBOARD PAGE
// ============================================
const DashboardPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const role = user?.role || 'employee';
  const data = dashboardData[role] || dashboardData.employee;

  const roleLabels = {
    super_admin: 'Super Administrator',
    org_admin: 'Organization Administrator',
    hr_manager: 'HR Manager',
    supervisor: 'Supervisor',
    employee: 'Employee'
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {role === 'employee' ? 'My Dashboard' : 'Dashboard'}
        </h1>
        <p className="text-gray-600">
          {roleLabels[role]} • {user?.organizationName || 'HR Analytics Platform'}
        </p>
      </div>

      {role === 'super_admin' && <SuperAdminDashboard data={data} />}
      {role === 'org_admin' && <OrgAdminDashboard data={data} />}
      {role === 'hr_manager' && <HRManagerDashboard data={data} />}
      {role === 'supervisor' && <SupervisorDashboard data={data} />}
      {role === 'employee' && <EmployeeDashboard data={data} user={user} />}
      
      {/* QuickSight Integration Note */}
      <div className="mt-8 bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-purple-100 rounded-lg">
            <BarChart3 className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">QuickSight Dashboards</h3>
            <p className="text-gray-600 text-sm mt-1">
              {role === 'employee' 
                ? 'Access your personal Controlio metrics and productivity reports.'
                : 'Access detailed analytics through embedded QuickSight dashboards below.'}
            </p>
            <div className="flex gap-2 mt-3">
              {role !== 'employee' && (
                <>
                  <button className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700">
                    Controlio Dashboard
                  </button>
                  <button className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700">
                    HR Productivity Dashboard
                  </button>
                </>
              )}
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
                {role === 'employee' ? 'My Performance Report' : 'Custom Reports'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;

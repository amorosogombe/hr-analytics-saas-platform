// mockData.js - Demo users and role-aligned dashboard content
// Place this in: frontend-app/src/data/mockData.js

// ============================================
// DEMO USERS
// ============================================
export const demoUsers = {
  // Super Admin - Platform-wide access
  'superadmin@hranalytics.demo': {
    id: 'user-super-001',
    email: 'superadmin@hranalytics.demo',
    name: 'System Super Admin',
    role: 'super_admin',
    group: 'SuperAdmins',
    organizationId: 'system',
    organizationName: 'HR Analytics Platform',
    approvalStatus: 'approved',
    permissions: {
      viewAllOrgs: true,
      manageOrgs: true,
      manageOrgAdmins: true,
      viewAllMetrics: true,
      deleteComments: true,
      approveComments: true,
      configureDataSources: true
    }
  },
  
  // Org Admin - Acme Corporation
  'orgadmin@acme.demo': {
    id: 'user-org-001',
    email: 'orgadmin@acme.demo',
    name: 'Acme Organization Admin',
    role: 'org_admin',
    group: 'OrgAdmins',
    organizationId: 'acme-corp',
    organizationName: 'Acme Corporation',
    approvalStatus: 'approved',
    permissions: {
      viewAllOrgs: false,
      manageOrgs: false,
      manageUsers: true,
      approveUsers: true,
      viewAllMetrics: true,
      deleteComments: true,
      approveComments: true,
      configureDataSources: true
    }
  },
  
  // HR Manager - Acme Corporation
  'hrmanager@acme.demo': {
    id: 'user-hr-001',
    email: 'hrmanager@acme.demo',
    name: 'Jane Wilson',
    role: 'hr_manager',
    group: 'HRManagers',
    organizationId: 'acme-corp',
    organizationName: 'Acme Corporation',
    department: 'Human Resources',
    approvalStatus: 'approved',
    permissions: {
      viewAllMetrics: true,
      deleteComments: true,
      approveComments: true,
      commentOnAll: true,
      manageUsers: false
    }
  },
  
  // Supervisor - Acme Corporation
  'supervisor@acme.demo': {
    id: 'user-sup-001',
    email: 'supervisor@acme.demo',
    name: 'Bob Martinez',
    role: 'supervisor',
    group: 'Supervisors',
    organizationId: 'acme-corp',
    organizationName: 'Acme Corporation',
    department: 'Engineering',
    teamId: 'team-eng-001',
    teamName: 'Frontend Team',
    approvalStatus: 'approved',
    permissions: {
      viewAllMetrics: true,
      viewTeamMetrics: true,
      deleteComments: false,
      approveComments: true,
      commentOnAll: true
    }
  },
  
  // Employee - Acme Corporation
  'employee@acme.demo': {
    id: 'user-emp-001',
    email: 'employee@acme.demo',
    name: 'Alice Johnson',
    role: 'employee',
    group: 'Employees',
    organizationId: 'acme-corp',
    organizationName: 'Acme Corporation',
    department: 'Engineering',
    teamId: 'team-eng-001',
    teamName: 'Frontend Team',
    supervisorId: 'user-sup-001',
    supervisorName: 'Bob Martinez',
    approvalStatus: 'approved',
    permissions: {
      viewOwnMetrics: true,
      viewAllMetrics: false,
      commentOnOwn: true,
      commentOnAll: false,
      approveComments: false,
      deleteComments: false
    }
  }
};

// Demo passwords (for reference - actual auth goes through Cognito)
export const demoPasswords = {
  'superadmin@hranalytics.demo': 'SuperAdmin@2025!',
  'orgadmin@acme.demo': 'OrgAdmin@2025!',
  'hrmanager@acme.demo': 'HRManager@2025!',
  'supervisor@acme.demo': 'Supervisor@2025!',
  'employee@acme.demo': 'Employee@2025!'
};

// ============================================
// ORGANIZATIONS
// ============================================
export const organizations = [
  {
    id: 'acme-corp',
    name: 'Acme Corporation',
    subdomain: 'acme',
    status: 'active',
    tier: 'enterprise',
    adminEmail: 'orgadmin@acme.demo',
    userCount: 156,
    dataSourcesConfigured: true,
    dataSources: ['Odoo', 'Controlio'],
    createdAt: '2024-01-15T10:00:00Z',
    dashboards: ['ControlioDashboard', 'HR Productivity Dashboard']
  },
  {
    id: 'techstart-inc',
    name: 'TechStart Inc',
    subdomain: 'techstart',
    status: 'active',
    tier: 'professional',
    adminEmail: 'admin@techstart.io',
    userCount: 42,
    dataSourcesConfigured: true,
    dataSources: ['Controlio'],
    createdAt: '2024-02-20T14:30:00Z'
  },
  {
    id: 'global-dynamics',
    name: 'Global Dynamics',
    subdomain: 'globaldyn',
    status: 'pending',
    tier: 'enterprise',
    adminEmail: 'it@globaldynamics.com',
    userCount: 0,
    dataSourcesConfigured: false,
    createdAt: '2024-11-28T09:15:00Z'
  }
];

// ============================================
// EMPLOYEES DATA (for team views)
// ============================================
export const employees = [
  {
    id: 'user-emp-001',
    name: 'Alice Johnson',
    email: 'employee@acme.demo',
    role: 'employee',
    department: 'Engineering',
    team: 'Frontend Team',
    supervisorId: 'user-sup-001',
    joinDate: '2023-06-15',
    productivityScore: 87,
    tasksCompleted: 24,
    activeTime: '7h 23m'
  },
  {
    id: 'user-emp-002',
    name: 'David Chen',
    email: 'david.chen@acme.demo',
    role: 'employee',
    department: 'Engineering',
    team: 'Frontend Team',
    supervisorId: 'user-sup-001',
    joinDate: '2023-08-20',
    productivityScore: 92,
    tasksCompleted: 31,
    activeTime: '8h 05m'
  },
  {
    id: 'user-emp-003',
    name: 'Sarah Miller',
    email: 'sarah.miller@acme.demo',
    role: 'employee',
    department: 'Engineering',
    team: 'Backend Team',
    supervisorId: 'user-sup-002',
    joinDate: '2022-11-10',
    productivityScore: 78,
    tasksCompleted: 18,
    activeTime: '6h 45m'
  }
];

// ============================================
// DASHBOARD DATA BY ROLE
// ============================================

// Super Admin Dashboard Data
export const superAdminDashboardData = {
  platformStats: {
    totalOrganizations: 12,
    activeOrganizations: 10,
    pendingApprovals: 2,
    totalUsers: 1247,
    activeUsersToday: 892
  },
  recentActivity: [
    { type: 'org_request', org: 'Global Dynamics', time: '2 hours ago' },
    { type: 'user_signup', user: 'john@techstart.io', org: 'TechStart Inc', time: '4 hours ago' },
    { type: 'org_approved', org: 'FinServ LLC', time: '1 day ago' }
  ],
  systemHealth: {
    apiLatency: '45ms',
    uptime: '99.97%',
    activeConnections: 234
  }
};

// Org Admin Dashboard Data
export const orgAdminDashboardData = {
  organizationStats: {
    totalEmployees: 156,
    activeToday: 142,
    pendingApprovals: 3,
    departments: 8,
    avgProductivity: 84
  },
  pendingApprovals: [
    { id: 1, name: 'Mark Thompson', email: 'mark.t@acme.com', role: 'employee', requestDate: '2024-11-27' },
    { id: 2, name: 'Lisa Wang', email: 'lisa.w@acme.com', role: 'supervisor', requestDate: '2024-11-28' },
    { id: 3, name: 'James Brown', email: 'james.b@acme.com', role: 'employee', requestDate: '2024-11-29' }
  ],
  dataSourceStatus: {
    odoo: { status: 'connected', lastSync: '10 minutes ago', records: 15420 },
    controlio: { status: 'connected', lastSync: '5 minutes ago', records: 89234 }
  },
  departmentMetrics: [
    { name: 'Engineering', employees: 45, avgProductivity: 88, activeNow: 42 },
    { name: 'Sales', employees: 32, avgProductivity: 82, activeNow: 28 },
    { name: 'Marketing', employees: 24, avgProductivity: 79, activeNow: 20 },
    { name: 'HR', employees: 12, avgProductivity: 85, activeNow: 11 },
    { name: 'Finance', employees: 18, avgProductivity: 91, activeNow: 16 }
  ]
};

// HR Manager Dashboard Data
export const hrManagerDashboardData = {
  overview: {
    totalEmployees: 156,
    avgProductivity: 84,
    avgActiveTime: '7h 12m',
    pendingComments: 8
  },
  productivityTrend: [
    { date: 'Mon', score: 82 },
    { date: 'Tue', score: 85 },
    { date: 'Wed', score: 88 },
    { date: 'Thu', score: 84 },
    { date: 'Fri', score: 79 }
  ],
  departmentComparison: [
    { department: 'Engineering', productivity: 88, attendance: 96 },
    { department: 'Sales', productivity: 82, attendance: 94 },
    { department: 'Marketing', productivity: 79, attendance: 92 },
    { department: 'HR', productivity: 85, attendance: 98 },
    { department: 'Finance', productivity: 91, attendance: 97 }
  ],
  pendingCommentApprovals: [
    { id: 1, employee: 'Alice Johnson', comment: 'Great progress on Q4 goals', author: 'Bob Martinez', date: '2024-11-28' },
    { id: 2, employee: 'David Chen', comment: 'Exceeded sprint targets', author: 'Bob Martinez', date: '2024-11-28' }
  ]
};

// Supervisor Dashboard Data
export const supervisorDashboardData = {
  teamOverview: {
    teamName: 'Frontend Team',
    teamSize: 8,
    avgProductivity: 86,
    tasksCompletedToday: 12,
    pendingTasks: 24
  },
  teamMembers: [
    { id: 'user-emp-001', name: 'Alice Johnson', productivity: 87, status: 'active', tasksToday: 3 },
    { id: 'user-emp-002', name: 'David Chen', productivity: 92, status: 'active', tasksToday: 4 },
    { id: 'user-emp-004', name: 'Emma Wilson', productivity: 81, status: 'active', tasksToday: 2 },
    { id: 'user-emp-005', name: 'Michael Lee', productivity: 89, status: 'break', tasksToday: 3 }
  ],
  weeklyProgress: [
    { day: 'Mon', completed: 18, target: 20 },
    { day: 'Tue', completed: 22, target: 20 },
    { day: 'Wed', completed: 19, target: 20 },
    { day: 'Thu', completed: 21, target: 20 },
    { day: 'Fri', completed: 15, target: 20 }
  ],
  recentComments: [
    { employee: 'Alice Johnson', comment: 'Completed UI redesign ahead of schedule', date: '2024-11-28', status: 'pending' },
    { employee: 'David Chen', comment: 'Fixed critical bug in checkout flow', date: '2024-11-27', status: 'approved' }
  ]
};

// Employee Dashboard Data (personal metrics only)
export const employeeDashboardData = {
  personalStats: {
    name: 'Alice Johnson',
    role: 'Frontend Developer',
    team: 'Frontend Team',
    supervisor: 'Bob Martinez',
    productivityScore: 87,
    weeklyAverage: 85,
    monthlyAverage: 84
  },
  todayActivity: {
    activeTime: '7h 23m',
    productiveTime: '6h 45m',
    breakTime: '38m',
    tasksCompleted: 3,
    tasksInProgress: 2
  },
  weeklyProductivity: [
    { day: 'Mon', score: 82, hours: 7.5 },
    { day: 'Tue', score: 88, hours: 8.0 },
    { day: 'Wed', score: 91, hours: 8.2 },
    { day: 'Thu', score: 85, hours: 7.8 },
    { day: 'Fri', score: 87, hours: 7.4 }
  ],
  recentTasks: [
    { id: 1, title: 'Update dashboard UI', status: 'completed', completedAt: '2024-11-28 14:30' },
    { id: 2, title: 'Fix responsive layout', status: 'completed', completedAt: '2024-11-28 11:15' },
    { id: 3, title: 'Review PR #234', status: 'in_progress' },
    { id: 4, title: 'Implement dark mode', status: 'in_progress' }
  ],
  myComments: [
    { id: 1, content: 'Completed sprint tasks early', date: '2024-11-27', status: 'approved' },
    { id: 2, content: 'Need clarification on new requirements', date: '2024-11-26', status: 'approved' }
  ],
  timesheetSummary: {
    thisWeek: { logged: 38.5, expected: 40 },
    thisMonth: { logged: 152, expected: 160 }
  }
};

// ============================================
// QUICKSIGHT DASHBOARD CONFIGURATION
// ============================================
export const quicksightDashboards = {
  controlio: {
    id: 'controlio-dashboard',
    name: 'Controlio Dashboard',
    description: 'Real-time employee activity monitoring',
    roles: ['super_admin', 'org_admin', 'hr_manager', 'supervisor'],
    metrics: ['Active Time', 'Productive Time', 'Application Usage', 'Website Tracking']
  },
  hrProductivity: {
    id: 'hr-productivity-dashboard',
    name: 'HR Productivity Dashboard',
    description: 'Comprehensive productivity analytics',
    roles: ['super_admin', 'org_admin', 'hr_manager'],
    metrics: ['Productivity Score', 'Task Completion', 'Time Analysis', 'Team Comparison']
  },
  employeePersonal: {
    id: 'employee-personal-dashboard',
    name: 'My Performance Dashboard',
    description: 'Personal productivity metrics',
    roles: ['employee', 'supervisor', 'hr_manager', 'org_admin', 'super_admin'],
    metrics: ['My Productivity', 'My Tasks', 'My Timesheet', 'My Goals']
  }
};

// ============================================
// COMMENT PERMISSIONS BY ROLE
// ============================================
export const commentPermissions = {
  super_admin: { view: 'all', comment: 'all', approve: true, delete: true },
  org_admin: { view: 'org', comment: 'org', approve: true, delete: true },
  hr_manager: { view: 'org', comment: 'org', approve: true, delete: true },
  supervisor: { view: 'org', comment: 'org', approve: true, delete: false },
  employee: { view: 'own', comment: 'own', approve: false, delete: false }
};

// ============================================
// HELPER FUNCTIONS
// ============================================
export const getDashboardDataForRole = (role) => {
  switch (role) {
    case 'super_admin':
      return { ...superAdminDashboardData, canViewAllOrgs: true };
    case 'org_admin':
      return { ...orgAdminDashboardData, canManageUsers: true };
    case 'hr_manager':
      return { ...hrManagerDashboardData, canDeleteComments: true };
    case 'supervisor':
      return { ...supervisorDashboardData, canApproveComments: true };
    case 'employee':
    default:
      return { ...employeeDashboardData, viewOwnOnly: true };
  }
};

export const canAccessDashboard = (userRole, dashboardId) => {
  const dashboard = Object.values(quicksightDashboards).find(d => d.id === dashboardId);
  return dashboard ? dashboard.roles.includes(userRole) : false;
};

export const getVisibleEmployees = (user) => {
  if (['super_admin', 'org_admin', 'hr_manager'].includes(user.role)) {
    return employees; // All employees
  }
  if (user.role === 'supervisor') {
    return employees.filter(e => e.supervisorId === user.id); // Team only
  }
  return employees.filter(e => e.id === user.id); // Self only
};

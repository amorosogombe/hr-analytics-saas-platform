const { QuickSightClient, GenerateEmbedUrlForRegisteredUserCommand, RegisterUserCommand, DescribeUserCommand } = require('@aws-sdk/client-quicksight');

const quicksightClient = new QuickSightClient({ region: process.env.REGION || 'eu-west-1' });

const ACCOUNT_ID = process.env.AWS_ACCOUNT_ID || '503561437485';
const NAMESPACE = 'default';

// Dashboard configuration with role-based access
const DASHBOARDS = {
  'hr-analytics': {
    id: 'a19998bb-32f0-4738-9e60-3af804a36975',
    name: 'HR Analytics Dashboard',
    allowedRoles: ['SuperAdmin', 'OrgAdmin', 'HRManager'],
  },
  'controlio': {
    id: '5faeaa7c-42ad-4c04-a270-7e9bd6934450',
    name: 'Controlio Dashboard',
    allowedRoles: ['SuperAdmin', 'OrgAdmin', 'HRManager', 'Supervisor'],
  },
};

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Content-Type': 'application/json',
};

// Helper function to extract role from Cognito groups or custom attribute
function extractUserRole(claims) {
  // First, check Cognito groups
  const cognitoGroups = claims['cognito:groups'];
  
  if (cognitoGroups) {
    // cognito:groups can be a string or array
    const groups = Array.isArray(cognitoGroups) ? cognitoGroups : [cognitoGroups];
    
    // Map Cognito groups to roles
    if (groups.includes('SuperAdmins')) return 'SuperAdmin';
    if (groups.includes('OrgAdmins')) return 'OrgAdmin';
    if (groups.includes('HRManagers')) return 'HRManager';
    if (groups.includes('Supervisors')) return 'Supervisor';
    if (groups.includes('Employees')) return 'Employee';
  }
  
  // Fallback to custom:role attribute
  const customRole = claims['custom:role'];
  if (customRole) {
    return customRole;
  }
  
  // Default to Employee
  return 'Employee';
}

exports.handler = async (event) => {
  console.log('Event:', JSON.stringify(event, null, 2));

  try {
    const path = event.resource;
    const method = event.httpMethod;

    // Handle OPTIONS for CORS
    if (method === 'OPTIONS') {
      return { statusCode: 200, headers, body: '' };
    }

    // Extract user info from Cognito authorizer
    const claims = event.requestContext?.authorizer?.claims;
    if (!claims) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Missing authorization' }),
      };
    }

    const userEmail = claims.email;
    const userId = claims.sub;
    const userRole = extractUserRole(claims);

    console.log('User Info:', { userEmail, userId, userRole, groups: claims['cognito:groups'] });

    if (!userEmail || !userId) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Invalid token: missing user info' }),
      };
    }

    // Route: GET /dashboards/embed-url?dashboard=hr-analytics
    if (path === '/dashboards/embed-url' && method === 'GET') {
      return await handleGetEmbedUrl(event, userEmail, userRole, userId);
    }

    // Route: GET /dashboards/list - List available dashboards for user
    if (path === '/dashboards/list' && method === 'GET') {
      return await handleListDashboards(userRole);
    }

    // Route: POST /dashboards/embed - Legacy endpoint (backward compatibility)
    if (path === '/dashboards/embed' && method === 'POST') {
      const body = JSON.parse(event.body || '{}');
      const dashboardKey = body.dashboard || 'hr-analytics';
      // Create a modified event with query parameters
      const modifiedEvent = {
        ...event,
        queryStringParameters: { dashboard: dashboardKey },
      };
      return await handleGetEmbedUrl(modifiedEvent, userEmail, userRole, userId);
    }

    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: 'Route not found' }),
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: error.message,
        details: error.stack 
      }),
    };
  }
};

async function handleGetEmbedUrl(event, userEmail, userRole, userId) {
  const dashboardKey = event.queryStringParameters?.dashboard || 'hr-analytics';
  
  console.log('Generating embed URL for dashboard:', dashboardKey);
  
  // Validate dashboard exists
  const dashboard = DASHBOARDS[dashboardKey];
  if (!dashboard) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ 
        error: 'Invalid dashboard key',
        availableDashboards: Object.keys(DASHBOARDS)
      }),
    };
  }

  // Check role-based access
  if (!dashboard.allowedRoles.includes(userRole)) {
    return {
      statusCode: 403,
      headers,
      body: JSON.stringify({ 
        error: 'Access denied: insufficient permissions for this dashboard',
        requiredRoles: dashboard.allowedRoles,
        userRole 
      }),
    };
  }

  try {
    // Ensure user exists in QuickSight (register if needed)
    const quicksightUser = await ensureQuickSightUser(userEmail, userRole);
    
    console.log('QuickSight user:', quicksightUser);
    
    // Generate embed URL
    const embedUrl = await generateEmbedUrl(
      quicksightUser.Arn,
      dashboard.id,
      userEmail
    );

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        embedUrl,
        dashboardId: dashboard.id,
        dashboardName: dashboard.name,
        expiresIn: 600, // 10 minutes
      }),
    };
  } catch (error) {
    console.error('Error generating embed URL:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Failed to generate embed URL',
        message: error.message 
      }),
    };
  }
}

async function handleListDashboards(userRole) {
  // Filter dashboards based on user role
  const availableDashboards = Object.entries(DASHBOARDS)
    .filter(([key, dashboard]) => dashboard.allowedRoles.includes(userRole))
    .map(([key, dashboard]) => ({
      key,
      id: dashboard.id,
      name: dashboard.name,
    }));

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      dashboards: availableDashboards,
      userRole,
    }),
  };
}

async function ensureQuickSightUser(email, role) {
  const username = email.replace('@', '_at_').replace(/\./g, '_');
  
  try {
    // Try to describe existing user
    const describeCommand = new DescribeUserCommand({
      AwsAccountId: ACCOUNT_ID,
      Namespace: NAMESPACE,
      UserName: username,
    });
    
    const user = await quicksightClient.send(describeCommand);
    console.log('Existing QuickSight user found:', username);
    return user.User;
  } catch (error) {
    if (error.name === 'ResourceNotFoundException') {
      // User doesn't exist, register them
      console.log(`Registering new QuickSight user: ${username}`);
      
      const registerCommand = new RegisterUserCommand({
        AwsAccountId: ACCOUNT_ID,
        Namespace: NAMESPACE,
        Email: email,
        IdentityType: 'QUICKSIGHT',
        UserRole: role === 'SuperAdmin' ? 'ADMIN' : 'READER',
        UserName: username,
      });
      
      const registeredUser = await quicksightClient.send(registerCommand);
      console.log('New QuickSight user registered:', username);
      return registeredUser.User;
    }
    console.error('Error checking/registering QuickSight user:', error);
    throw error;
  }
}

async function generateEmbedUrl(userArn, dashboardId, userEmail) {
  const command = new GenerateEmbedUrlForRegisteredUserCommand({
    AwsAccountId: ACCOUNT_ID,
    UserArn: userArn,
    ExperienceConfiguration: {
      Dashboard: {
        InitialDashboardId: dashboardId,
      },
    },
    SessionLifetimeInMinutes: 600, // 10 hours
    AllowedDomains: [
      'https://main.d1mlg7uwn5ksst.amplifyapp.com',
      'http://localhost:3000', // For local development
    ],
  });

  const response = await quicksightClient.send(command);
  console.log('Embed URL generated successfully');
  return response.EmbedUrl;
}

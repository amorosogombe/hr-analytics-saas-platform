const { 
  QuickSightClient, 
  GenerateEmbedUrlForRegisteredUserCommand,
  DescribeUserCommand,
  RegisterUserCommand,
  UpdateDashboardPermissionsCommand,
  DescribeDashboardPermissionsCommand
} = require('@aws-sdk/client-quicksight');

const quicksightClient = new QuickSightClient({ region: process.env.REGION });

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'Content-Type': 'application/json',
};

// Dashboard configuration based on roles
const DASHBOARD_CONFIG = {
  'hr-analytics': {
    dashboardId: 'a19998bb-32f0-4738-9e60-3af804a36975',
    name: 'HR Analytics Dashboard',
    allowedRoles: ['SuperAdmin', 'OrgAdmin', 'HRManager', 'Supervisor'],
  },
  'controlio': {
    dashboardId: '5faeaa7c-42ad-4c04-a270-7e9bd6934450',
    name: 'Controlio Dashboard',
    allowedRoles: ['SuperAdmin', 'OrgAdmin', 'HRManager'],
  },
};

exports.handler = async (event) => {
  console.log('Event:', JSON.stringify(event, null, 2));

  try {
    const path = event.resource;
    const method = event.httpMethod;

    // Handle OPTIONS for CORS
    if (method === 'OPTIONS') {
      return { statusCode: 200, headers, body: '' };
    }

    // Route: GET /dashboards/embed-url
    if (path === '/dashboards/embed-url' && method === 'GET') {
      return await handleGetEmbedUrl(event);
    }

    // Route: GET /dashboards/list
    if (path === '/dashboards/list' && method === 'GET') {
      return await handleListDashboards(event);
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
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined 
      }),
    };
  }
};

/**
 * Generate embed URL for a specific dashboard
 */
async function handleGetEmbedUrl(event) {
  try {
    // Extract and validate authorization token
    const authHeader = event.headers.Authorization || event.headers.authorization;
    if (!authHeader) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Authorization header required' }),
      };
    }

    // Get dashboard ID from query parameters
    const dashboardKey = event.queryStringParameters?.dashboard;
    if (!dashboardKey) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Dashboard parameter required (hr-analytics or controlio)' }),
      };
    }

    const dashboardConfig = DASHBOARD_CONFIG[dashboardKey];
    if (!dashboardConfig) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Dashboard not found' }),
      };
    }

    // Decode JWT token to get user info
    const token = authHeader.replace('Bearer ', '');
    const payload = decodeJWT(token);
    const userEmail = payload.email;
    const userGroups = payload['cognito:groups'] || [];

    console.log('User email:', userEmail);
    console.log('User groups:', userGroups);

    // Check if user has permission to view this dashboard
    const hasPermission = dashboardConfig.allowedRoles.some(role => 
      userGroups.includes(role) || userGroups.includes(`${role}s`)
    );

    if (!hasPermission) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ 
          error: 'You do not have permission to view this dashboard',
          requiredRoles: dashboardConfig.allowedRoles 
        }),
      };
    }

    // Ensure user exists in QuickSight and has dashboard access
    await ensureQuickSightUserAndAccess(userEmail, dashboardConfig.dashboardId, userGroups);

    // Generate QuickSight embed URL
    const embedUrl = await generateEmbedUrl(
      userEmail,
      dashboardConfig.dashboardId
    );

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        embedUrl,
        dashboardId: dashboardConfig.dashboardId,
        dashboardName: dashboardConfig.name,
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

/**
 * List available dashboards for the current user
 */
async function handleListDashboards(event) {
  try {
    const authHeader = event.headers.Authorization || event.headers.authorization;
    if (!authHeader) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Authorization header required' }),
      };
    }

    const token = authHeader.replace('Bearer ', '');
    const payload = decodeJWT(token);
    const userGroups = payload['cognito:groups'] || [];

    // Determine user role for response
    let userRole = 'Employee';
    const roleMapping = {
      'SuperAdmins': 'SuperAdmin',
      'OrgAdmins': 'OrgAdmin',
      'HRManagers': 'HRManager',
      'Supervisors': 'Supervisor',
      'Employees': 'Employee'
    };
    
    for (const [group, role] of Object.entries(roleMapping)) {
      if (userGroups.includes(group)) {
        userRole = role;
        break;
      }
    }

    // Filter dashboards based on user roles
    const availableDashboards = Object.entries(DASHBOARD_CONFIG)
      .filter(([key, config]) => 
        config.allowedRoles.some(role => 
          userGroups.includes(role) || userGroups.includes(`${role}s`)
        )
      )
      .map(([key, config]) => ({
        key,
        id: config.dashboardId,
        name: config.name,
        allowedRoles: config.allowedRoles,
      }));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        dashboards: availableDashboards,
        userRole
      }),
    };
  } catch (error) {
    console.error('Error listing dashboards:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message }),
    };
  }
}

/**
 * Ensure user exists in QuickSight and has access to the dashboard
 */
async function ensureQuickSightUserAndAccess(userEmail, dashboardId, userGroups) {
  const namespace = 'default';
  
  try {
    // Check if user exists
    const describeCommand = new DescribeUserCommand({
      AwsAccountId: process.env.AWS_ACCOUNT_ID,
      Namespace: namespace,
      UserName: userEmail,
    });

    await quicksightClient.send(describeCommand);
    console.log('User exists in QuickSight:', userEmail);
  } catch (error) {
    if (error.name === 'ResourceNotFoundException') {
      // User doesn't exist, register them
      console.log('Registering new QuickSight user:', userEmail);
      
      const registerCommand = new RegisterUserCommand({
        AwsAccountId: process.env.AWS_ACCOUNT_ID,
        Namespace: namespace,
        Email: userEmail,
        IdentityType: 'QUICKSIGHT',
        UserRole: 'READER', // Basic viewer role
        UserName: userEmail,
      });

      await quicksightClient.send(registerCommand);
      console.log('User registered successfully');
    } else {
      throw error;
    }
  }

  // Grant dashboard access
  await grantDashboardAccess(userEmail, dashboardId, namespace);
}

/**
 * Grant user access to a specific dashboard
 */
async function grantDashboardAccess(userEmail, dashboardId, namespace) {
  const userArn = `arn:aws:quicksight:${process.env.REGION}:${process.env.AWS_ACCOUNT_ID}:user/${namespace}/${userEmail}`;

  try {
    // Check current permissions
    const describePermCommand = new DescribeDashboardPermissionsCommand({
      AwsAccountId: process.env.AWS_ACCOUNT_ID,
      DashboardId: dashboardId,
    });

    const currentPerms = await quicksightClient.send(describePermCommand);
    
    // Check if user already has access
    const hasAccess = currentPerms.Permissions?.some(perm => 
      perm.Principal === userArn
    );

    if (hasAccess) {
      console.log('User already has dashboard access');
      return;
    }

    // Grant access
    console.log('Granting dashboard access to:', userEmail);
    const updateCommand = new UpdateDashboardPermissionsCommand({
      AwsAccountId: process.env.AWS_ACCOUNT_ID,
      DashboardId: dashboardId,
      GrantPermissions: [
        {
          Principal: userArn,
          Actions: [
            'quicksight:DescribeDashboard',
            'quicksight:ListDashboardVersions',
            'quicksight:QueryDashboard',
          ],
        },
      ],
    });

    await quicksightClient.send(updateCommand);
    console.log('Dashboard access granted successfully');
  } catch (error) {
    console.error('Error granting dashboard access:', error);
    // Don't fail if we can't grant permissions - the embed URL might still work
    console.warn('Continuing despite permission grant error');
  }
}

/**
 * Generate QuickSight embed URL using RegisteredUser embedding
 */
async function generateEmbedUrl(userEmail, dashboardId) {
  // Create a QuickSight user ARN (using email as username)
  const quicksightUserArn = `arn:aws:quicksight:${process.env.REGION}:${process.env.AWS_ACCOUNT_ID}:user/default/${userEmail}`;

  const command = new GenerateEmbedUrlForRegisteredUserCommand({
    AwsAccountId: process.env.AWS_ACCOUNT_ID,
    UserArn: quicksightUserArn,
    SessionLifetimeInMinutes: 600, // 10 hours
    ExperienceConfiguration: {
      Dashboard: {
        InitialDashboardId: dashboardId,
      },
    },
    AllowedDomains: [
      'https://main.d1mlg7uwn5ksst.amplifyapp.com',
      'http://localhost:3000',
    ],
  });

  try {
    const response = await quicksightClient.send(command);
    return response.EmbedUrl;
  } catch (error) {
    console.error('QuickSight API Error:', error);
    throw error;
  }
}

/**
 * Decode JWT token (basic decoding, not verification)
 * In production, you should verify the token signature
 */
function decodeJWT(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT token');
    }
    
    const payload = parts[1];
    const decoded = Buffer.from(payload, 'base64').toString('utf8');
    return JSON.parse(decoded);
  } catch (error) {
    throw new Error('Failed to decode JWT token');
  }
}

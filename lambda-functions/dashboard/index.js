const { QuickSightClient, GenerateEmbedUrlForRegisteredUserCommand, ListDashboardsCommand } = require('@aws-sdk/client-quicksight');

const quicksightClient = new QuickSightClient({ region: process.env.REGION });

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'Content-Type': 'application/json',
};

// Dashboard role permissions based on user role
const ROLE_PERMISSIONS = {
  SuperAdmins: {
    canView: 'all',
    canComment: 'all',
    canApprove: 'all',
    canDelete: 'all',
  },
  OrgAdmins: {
    canView: 'all',
    canComment: 'all',
    canApprove: 'all',
    canDelete: 'all',
  },
  HRManagers: {
    canView: 'all',
    canComment: 'all',
    canApprove: 'all',
    canDelete: 'all',
  },
  Supervisors: {
    canView: 'all',
    canComment: 'all',
    canApprove: 'all',
    canDelete: 'none',
  },
  Employees: {
    canView: 'own',
    canComment: 'own',
    canApprove: 'none',
    canDelete: 'none',
  },
};

exports.handler = async (event) => {
  console.log('Event:', JSON.stringify(event, null, 2));

  try {
    const path = event.resource;
    const method = event.httpMethod;

    if (method === 'OPTIONS') {
      return { statusCode: 200, headers, body: '' };
    }

    const claims = event.requestContext.authorizer.claims;
    const userGroups = claims['cognito:groups'] ? claims['cognito:groups'].split(',') : [];

    if (path === '/dashboards/embed' && method === 'POST') {
      return await handleGenerateEmbedUrl(event, claims, userGroups);
    }

    if (path === '/dashboards/list' && method === 'GET') {
      return await handleListDashboards(event, claims, userGroups);
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
      body: JSON.stringify({ error: error.message }),
    };
  }
};

async function handleGenerateEmbedUrl(event, claims, userGroups) {
  try {
    const body = JSON.parse(event.body);
    const { dashboardId } = body;

    if (!dashboardId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Dashboard ID is required' }),
      };
    }

    const userEmail = claims.email;
    const userId = claims.sub;
    const organizationId = claims['custom:organizationId'];

    // Determine user's highest role
    let userRole = 'Employees';
    if (userGroups.includes('SuperAdmins')) userRole = 'SuperAdmins';
    else if (userGroups.includes('OrgAdmins')) userRole = 'OrgAdmins';
    else if (userGroups.includes('HRManagers')) userRole = 'HRManagers';
    else if (userGroups.includes('Supervisors')) userRole = 'Supervisors';

    // Get role permissions
    const permissions = ROLE_PERMISSIONS[userRole] || ROLE_PERMISSIONS.Employees;

    // Build QuickSight embed URL
    const awsAccountId = process.env.AWS_ACCOUNT_ID || context.invokedFunctionArn.split(':')[4];
    
    const embedUrlCommand = new GenerateEmbedUrlForRegisteredUserCommand({
      AwsAccountId: awsAccountId,
      UserArn: `arn:aws:quicksight:${process.env.REGION}:${awsAccountId}:user/default/${userEmail}`,
      ExperienceConfiguration: {
        Dashboard: {
          InitialDashboardId: dashboardId,
        },
      },
      SessionLifetimeInMinutes: 600, // 10 hours
      AllowedDomains: ['*'], // Configure this based on your domain
    });

    const embedUrlResponse = await quicksightClient.send(embedUrlCommand);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        embedUrl: embedUrlResponse.EmbedUrl,
        permissions,
        userRole,
        expiresIn: 600,
      }),
    };
  } catch (error) {
    console.error('Generate embed URL error:', error);
    
    // If user doesn't exist in QuickSight, return helpful error
    if (error.name === 'ResourceNotFoundException') {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ 
          error: 'QuickSight user not found. Please ensure the user is registered in QuickSight.',
          code: 'QUICKSIGHT_USER_NOT_FOUND',
        }),
      };
    }

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to generate embed URL: ' + error.message }),
    };
  }
}

async function handleListDashboards(event, claims, userGroups) {
  try {
    const organizationId = claims['custom:organizationId'];
    const userRole = getUserHighestRole(userGroups);

    // Mock dashboard list - in production, this would query QuickSight
    // and filter based on organization and user permissions
    const dashboards = [
      {
        id: 'controlio-dashboard',
        name: 'Controlio Dashboard',
        description: 'Employee productivity tracking and analytics',
        category: 'productivity',
        organizationId,
      },
      {
        id: 'hr-productivity-dashboard',
        name: 'HUMAN RESOURCES PRODUCTIVITY DASHBOARD',
        description: 'Comprehensive HR analytics and reporting',
        category: 'hr',
        organizationId,
      },
    ];

    // Filter dashboards based on user permissions
    const permissions = ROLE_PERMISSIONS[userRole] || ROLE_PERMISSIONS.Employees;
    
    const accessibleDashboards = dashboards.map(dashboard => ({
      ...dashboard,
      permissions: {
        canView: permissions.canView !== 'none',
        canComment: permissions.canComment !== 'none',
        canApprove: permissions.canApprove !== 'none',
        canDelete: permissions.canDelete !== 'none',
      },
    }));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        dashboards: accessibleDashboards,
        userRole,
        count: accessibleDashboards.length,
      }),
    };
  } catch (error) {
    console.error('List dashboards error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to list dashboards' }),
    };
  }
}

function getUserHighestRole(userGroups) {
  if (userGroups.includes('SuperAdmins')) return 'SuperAdmins';
  if (userGroups.includes('OrgAdmins')) return 'OrgAdmins';
  if (userGroups.includes('HRManagers')) return 'HRManagers';
  if (userGroups.includes('Supervisors')) return 'Supervisors';
  return 'Employees';
}

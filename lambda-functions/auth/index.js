const { CognitoIdentityProviderClient, AdminGetUserCommand, AdminCreateUserCommand, AdminSetUserPasswordCommand, AdminAddUserToGroupCommand, AdminUpdateUserAttributesCommand } = require('@aws-sdk/client-cognito-identity-provider');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');

const cognitoClient = new CognitoIdentityProviderClient({ region: process.env.REGION });
const dynamoClient = new DynamoDBClient({ region: process.env.REGION });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'Content-Type': 'application/json',
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

    // Route handlers
    if (path === '/auth/signup' && method === 'POST') {
      return await handleSignup(event);
    }

    if (path === '/auth/login' && method === 'POST') {
      return await handleLogin(event);
    }

    if (path === '/auth/me' && method === 'GET') {
      return await handleGetCurrentUser(event);
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

async function handleSignup(event) {
  const body = JSON.parse(event.body);
  const { email, password, fullName, organizationId, role, department, isOrgAdmin } = body;

  // Validate required fields
  if (!email || !password || !fullName) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Email, password, and full name are required' }),
    };
  }

  try {
    // Determine user group based on role or isOrgAdmin flag
    let userGroup = 'Employees';
    if (isOrgAdmin) {
      // This is an organization admin signup (new organization request)
      userGroup = 'OrgAdmins';
    } else if (role) {
      // Map role to Cognito group
      const roleGroupMap = {
        'hr_manager': 'HRManagers',
        'supervisor': 'Supervisors',
        'employee': 'Employees',
      };
      userGroup = roleGroupMap[role] || 'Employees';
    }

    // Create user in Cognito
    const createUserCommand = new AdminCreateUserCommand({
      UserPoolId: process.env.USER_POOL_ID,
      Username: email,
      UserAttributes: [
        { Name: 'email', Value: email },
        { Name: 'email_verified', Value: 'true' },
        { Name: 'name', Value: fullName },
        { Name: 'custom:organizationId', Value: organizationId || 'pending' },
        { Name: 'custom:role', Value: role || userGroup.toLowerCase() },
        { Name: 'custom:department', Value: department || '' },
        { Name: 'custom:approvalStatus', Value: isOrgAdmin ? 'pending_org_approval' : 'pending_approval' },
      ],
      MessageAction: 'SUPPRESS', // We'll set password directly
    });

    await cognitoClient.send(createUserCommand);

    // Set permanent password
    const setPasswordCommand = new AdminSetUserPasswordCommand({
      UserPoolId: process.env.USER_POOL_ID,
      Username: email,
      Password: password,
      Permanent: true,
    });

    await cognitoClient.send(setPasswordCommand);

    // Add user to appropriate group
    const addToGroupCommand = new AdminAddUserToGroupCommand({
      UserPoolId: process.env.USER_POOL_ID,
      Username: email,
      GroupName: userGroup,
    });

    await cognitoClient.send(addToGroupCommand);

    // Create user record in DynamoDB
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = new Date().toISOString();

    const userRecord = {
      organizationId: organizationId || 'pending',
      userId,
      email,
      fullName,
      role: role || userGroup.toLowerCase(),
      department: department || '',
      approvalStatus: isOrgAdmin ? 'pending_org_approval' : 'pending_approval',
      isOrgAdmin: isOrgAdmin || false,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    await docClient.send(new PutCommand({
      TableName: process.env.USERS_TABLE,
      Item: userRecord,
    }));

    // If this is an org admin signup, create organization request
    if (isOrgAdmin && body.organizationName) {
      const orgId = `org_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const orgRecord = {
        organizationId: orgId,
        name: body.organizationName,
        subdomain: body.subdomain || body.organizationName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        adminEmail: email,
        adminUserId: userId,
        status: 'pending_approval',
        createdAt: timestamp,
        updatedAt: timestamp,
      };

      await docClient.send(new PutCommand({
        TableName: process.env.ORGANIZATIONS_TABLE,
        Item: orgRecord,
      }));

      // Update user record with organization ID
      userRecord.organizationId = orgId;
      await docClient.send(new PutCommand({
        TableName: process.env.USERS_TABLE,
        Item: userRecord,
      }));
    }

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({
        message: 'User created successfully. Awaiting approval.',
        userId,
        email,
        approvalStatus: userRecord.approvalStatus,
      }),
    };
  } catch (error) {
    console.error('Signup error:', error);
    
    if (error.name === 'UsernameExistsException') {
      return {
        statusCode: 409,
        headers,
        body: JSON.stringify({ error: 'User with this email already exists' }),
      };
    }

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to create user: ' + error.message }),
    };
  }
}

async function handleLogin(event) {
  // Note: Actual login is handled by Cognito directly via AWS Amplify on frontend
  // This endpoint is for validation and fetching user details after Cognito auth
  const body = JSON.parse(event.body);
  const { email } = body;

  try {
    // Get user from Cognito
    const getUserCommand = new AdminGetUserCommand({
      UserPoolId: process.env.USER_POOL_ID,
      Username: email,
    });

    const cognitoUser = await cognitoClient.send(getUserCommand);

    // Get approval status
    const approvalStatusAttr = cognitoUser.UserAttributes.find(
      attr => attr.Name === 'custom:approvalStatus'
    );
    const approvalStatus = approvalStatusAttr?.Value || 'pending_approval';

    if (approvalStatus !== 'approved') {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ 
          error: 'Account not yet approved',
          approvalStatus,
        }),
      };
    }

    // Get user details from DynamoDB
    const orgIdAttr = cognitoUser.UserAttributes.find(
      attr => attr.Name === 'custom:organizationId'
    );
    const organizationId = orgIdAttr?.Value;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'Login validation successful',
        email,
        organizationId,
        approvalStatus,
      }),
    };
  } catch (error) {
    console.error('Login validation error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Login validation failed: ' + error.message }),
    };
  }
}

async function handleGetCurrentUser(event) {
  try {
    // Get user from JWT token claims
    const claims = event.requestContext.authorizer.claims;
    const email = claims.email;
    const sub = claims.sub;

    // Get user from Cognito
    const getUserCommand = new AdminGetUserCommand({
      UserPoolId: process.env.USER_POOL_ID,
      Username: email,
    });

    const cognitoUser = await cognitoClient.send(getUserCommand);

    // Extract user attributes
    const attributes = {};
    cognitoUser.UserAttributes.forEach(attr => {
      attributes[attr.Name] = attr.Value;
    });

    // Get user from DynamoDB for additional details
    const orgId = attributes['custom:organizationId'];
    const userId = sub;

    let userDetails = null;
    try {
      const result = await docClient.send(new GetCommand({
        TableName: process.env.USERS_TABLE,
        Key: { organizationId: orgId, userId },
      }));
      userDetails = result.Item;
    } catch (err) {
      console.warn('Could not fetch user details from DynamoDB:', err);
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        userId: sub,
        email: attributes.email,
        fullName: attributes.name,
        organizationId: attributes['custom:organizationId'],
        role: attributes['custom:role'],
        department: attributes['custom:department'],
        approvalStatus: attributes['custom:approvalStatus'],
        groups: claims['cognito:groups'] || [],
        ...userDetails,
      }),
    };
  } catch (error) {
    console.error('Get current user error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to get user details: ' + error.message }),
    };
  }
}

const { 
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
  AdminDeleteUserCommand,
  AdminGetUserCommand,
  AdminAddUserToGroupCommand,
  AdminSetUserPasswordCommand,
  SignUpCommand,
  ConfirmSignUpCommand,
} = require('@aws-sdk/client-cognito-identity-provider');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');

const cognitoClient = new CognitoIdentityProviderClient({ region: process.env.REGION });
const dynamoClient = new DynamoDBClient({ region: process.env.REGION });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
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

    // Route: GET /auth/lookup-organization
    if (path === '/auth/lookup-organization' && method === 'GET') {
      return await handleLookupOrganization(event);
    }

    // Route: POST /auth/register-user
    if (path === '/auth/register-user' && method === 'POST') {
      return await handleRegisterUser(event);
    }

    // Route: POST /auth/verify-email
    if (path === '/auth/verify-email' && method === 'POST') {
      return await handleVerifyEmail(event);
    }

    // Route: GET /auth/me
    if (path === '/auth/me' && method === 'GET') {
      return await handleGetMe(event);
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

/**
 * Lookup organization by email domain
 */
async function handleLookupOrganization(event) {
  try {
    const domain = event.queryStringParameters?.domain;
    
    if (!domain) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Domain parameter required' }),
      };
    }

    console.log('Looking up organization for domain:', domain);

    // Query organizations table for matching domain
    const result = await docClient.send(new QueryCommand({
      TableName: process.env.ORGANIZATIONS_TABLE,
      IndexName: 'DomainIndex', // We'll need to create this GSI
      KeyConditionExpression: '#domain = :domain',
      ExpressionAttributeNames: {
        '#domain': 'domain',
      },
      ExpressionAttributeValues: {
        ':domain': domain,
      },
    }));

    if (result.Items && result.Items.length > 0) {
      const org = result.Items[0];
      
      // Only return active organizations
      if (org.status === 'active') {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            organization: {
              organizationId: org.organizationId,
              name: org.name,
              subdomain: org.subdomain,
            },
          }),
        };
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ organization: null }),
    };
  } catch (error) {
    console.error('Error looking up organization:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to lookup organization' }),
    };
  }
}

/**
 * Register a new user (Employee/Supervisor/HR Manager)
 */
async function handleRegisterUser(event) {
  try {
    const body = JSON.parse(event.body);
    const { email, password, fullName, role, organizationId } = body;

    // Validation
    if (!email || !password || !fullName || !role || !organizationId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'All fields are required' }),
      };
    }

    // Validate role (only these 3 roles can register)
    const allowedRoles = ['Employees', 'Supervisors', 'HRManagers'];
    if (!allowedRoles.includes(role)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid role. Only Employee, Supervisor, or HR Manager can register.' }),
      };
    }

    // Check if organization exists and is active
    const orgResult = await docClient.send(new GetCommand({
      TableName: process.env.ORGANIZATIONS_TABLE,
      Key: { organizationId },
    }));

    if (!orgResult.Item) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Organization not found' }),
      };
    }

    if (orgResult.Item.status !== 'active') {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Organization is not active' }),
      };
    }

    console.log('Registering user:', email, 'for org:', organizationId);

    // Create user in Cognito (with email verification required)
    const signUpCommand = new SignUpCommand({
      ClientId: process.env.USER_POOL_CLIENT_ID,
      Username: email,
      Password: password,
      UserAttributes: [
        { Name: 'email', Value: email },
        { Name: 'name', Value: fullName },
      ],
    });

    const signUpResult = await cognitoClient.send(signUpCommand);
    console.log('Cognito signup result:', signUpResult);

    const userId = signUpResult.UserSub;

    // Create user record in DynamoDB (status: pending_approval)
    await docClient.send(new PutCommand({
      TableName: process.env.USERS_TABLE,
      Item: {
        userId,
        email,
        fullName,
        organizationId,
        role,
        approvalStatus: 'pending_approval', // Awaiting OrgAdmin approval
        emailVerified: false, // Will be true after verification
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    }));

    console.log('User record created in DynamoDB');

    // TODO: Send email notification to OrgAdmin
    // This would use SES to notify org admins of pending approval

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Registration successful. Please check your email for verification code.',
        needsVerification: true,
        userId,
      }),
    };
  } catch (error) {
    console.error('Error registering user:', error);
    
    // Handle specific Cognito errors
    if (error.name === 'UsernameExistsException') {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'An account with this email already exists' }),
      };
    }
    
    if (error.name === 'InvalidPasswordException') {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Password does not meet requirements (minimum 8 characters)' }),
      };
    }

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Registration failed. Please try again.' }),
    };
  }
}

/**
 * Verify user email with confirmation code
 */
async function handleVerifyEmail(event) {
  try {
    const body = JSON.parse(event.body);
    const { email, code } = body;

    if (!email || !code) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Email and code are required' }),
      };
    }

    console.log('Verifying email for:', email);

    // Confirm signup in Cognito
    const confirmCommand = new ConfirmSignUpCommand({
      ClientId: process.env.USER_POOL_CLIENT_ID,
      Username: email,
      ConfirmationCode: code,
    });

    await cognitoClient.send(confirmCommand);
    console.log('Email verified in Cognito');

    // Update user record in DynamoDB
    // First, find the user by email
    const queryResult = await docClient.send(new QueryCommand({
      TableName: process.env.USERS_TABLE,
      IndexName: 'EmailIndex', // Need to create this GSI
      KeyConditionExpression: 'email = :email',
      ExpressionAttributeValues: {
        ':email': email,
      },
    }));

    if (queryResult.Items && queryResult.Items.length > 0) {
      const user = queryResult.Items[0];
      
      // Update emailVerified flag
      await docClient.send(new PutCommand({
        TableName: process.env.USERS_TABLE,
        Item: {
          ...user,
          emailVerified: true,
          updatedAt: new Date().toISOString(),
        },
      }));

      console.log('User emailVerified flag updated');
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Email verified successfully. Awaiting administrator approval.',
      }),
    };
  } catch (error) {
    console.error('Error verifying email:', error);
    
    if (error.name === 'CodeMismatchException') {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid verification code' }),
      };
    }
    
    if (error.name === 'ExpiredCodeException') {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Verification code has expired' }),
      };
    }

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Email verification failed' }),
    };
  }
}

/**
 * Get current user info
 */
async function handleGetMe(event) {
  try {
    // Extract token from Authorization header
    const authHeader = event.headers.Authorization || event.headers.authorization;
    if (!authHeader) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'No authorization token' }),
      };
    }

    // Decode JWT to get user email
    const token = authHeader.replace('Bearer ', '');
    const payload = decodeJWT(token);
    const email = payload.email;
    const groups = payload['cognito:groups'] || [];

    // Get user from DynamoDB
    const queryResult = await docClient.send(new QueryCommand({
      TableName: process.env.USERS_TABLE,
      IndexName: 'EmailIndex',
      KeyConditionExpression: 'email = :email',
      ExpressionAttributeValues: {
        ':email': email,
      },
    }));

    if (!queryResult.Items || queryResult.Items.length === 0) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'User not found' }),
      };
    }

    const user = queryResult.Items[0];

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        userId: user.userId,
        email: user.email,
        fullName: user.fullName,
        organizationId: user.organizationId,
        role: user.role,
        approvalStatus: user.approvalStatus,
        groups,
      }),
    };
  } catch (error) {
    console.error('Error getting user:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to get user info' }),
    };
  }
}

/**
 * Decode JWT token (basic decoding, not verification)
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

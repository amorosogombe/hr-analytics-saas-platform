const { 
  CognitoIdentityProviderClient,
  AdminGetUserCommand,
  AdminAddUserToGroupCommand,
  AdminDeleteUserCommand,
  AdminUpdateUserAttributesCommand,
} = require('@aws-sdk/client-cognito-identity-provider');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, QueryCommand, PutCommand, DeleteCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');

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

    // Extract user from token
    const authHeader = event.headers.Authorization || event.headers.authorization;
    if (!authHeader) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Authorization required' }),
      };
    }

    const token = authHeader.replace('Bearer ', '');
    const tokenPayload = decodeJWT(token);
    const currentUserEmail = tokenPayload.email;
    const currentUserGroups = tokenPayload['cognito:groups'] || [];

    // Route: GET /users
    if (path === '/users' && method === 'GET') {
      return await handleListUsers(currentUserEmail, currentUserGroups);
    }

    // Route: POST /users/{userId}/approve
    if (path === '/users/{userId}/approve' && method === 'POST') {
      const userId = event.pathParameters.userId;
      return await handleApproveUser(userId, currentUserEmail, currentUserGroups);
    }

    // Route: DELETE /users/{userId}
    if (path === '/users/{userId}' && method === 'DELETE') {
      const userId = event.pathParameters.userId;
      return await handleDeleteUser(userId, currentUserEmail, currentUserGroups);
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
 * List users - OrgAdmins see their org, SuperAdmins see all
 */
async function handleListUsers(currentUserEmail, currentUserGroups) {
  try {
    const isSuperAdmin = currentUserGroups.includes('SuperAdmins');
    const isOrgAdmin = currentUserGroups.includes('OrgAdmins');

    if (!isSuperAdmin && !isOrgAdmin) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: 'Access denied. Only admins can view users.' }),
      };
    }

    let users = [];

    if (isSuperAdmin) {
      // SuperAdmins see all users
      const result = await docClient.send(new ScanCommand({
        TableName: process.env.USERS_TABLE,
      }));
      users = result.Items || [];
    } else {
      // OrgAdmins see only their organization's users
      // First, get the current user's organization
      const currentUserResult = await docClient.send(new QueryCommand({
        TableName: process.env.USERS_TABLE,
        IndexName: 'EmailIndex',
        KeyConditionExpression: 'email = :email',
        ExpressionAttributeValues: {
          ':email': currentUserEmail,
        },
      }));

      if (!currentUserResult.Items || currentUserResult.Items.length === 0) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'Current user not found' }),
        };
      }

      const currentUser = currentUserResult.Items[0];
      const organizationId = currentUser.organizationId;

      // Get all users in the same organization
      const result = await docClient.send(new QueryCommand({
        TableName: process.env.USERS_TABLE,
        IndexName: 'OrganizationIndex',
        KeyConditionExpression: 'organizationId = :orgId',
        ExpressionAttributeValues: {
          ':orgId': organizationId,
        },
      }));

      users = result.Items || [];
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ users }),
    };
  } catch (error) {
    console.error('Error listing users:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to list users' }),
    };
  }
}

/**
 * Approve a user - Only OrgAdmins can approve users in their org
 */
async function handleApproveUser(userId, currentUserEmail, currentUserGroups) {
  try {
    const isSuperAdmin = currentUserGroups.includes('SuperAdmins');
    const isOrgAdmin = currentUserGroups.includes('OrgAdmins');

    if (!isOrgAdmin && !isSuperAdmin) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: 'Access denied. Only admins can approve users.' }),
      };
    }

    // Get the user to approve
    const userResult = await docClient.send(new GetCommand({
      TableName: process.env.USERS_TABLE,
      Key: { userId },
    }));

    if (!userResult.Item) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'User not found' }),
      };
    }

    const userToApprove = userResult.Item;

    // If OrgAdmin, check they're in the same organization
    if (isOrgAdmin && !isSuperAdmin) {
      const currentUserResult = await docClient.send(new QueryCommand({
        TableName: process.env.USERS_TABLE,
        IndexName: 'EmailIndex',
        KeyConditionExpression: 'email = :email',
        ExpressionAttributeValues: {
          ':email': currentUserEmail,
        },
      }));

      if (!currentUserResult.Items || currentUserResult.Items.length === 0) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'Current user not found' }),
        };
      }

      const currentUser = currentUserResult.Items[0];
      
      if (currentUser.organizationId !== userToApprove.organizationId) {
        return {
          statusCode: 403,
          headers,
          body: JSON.stringify({ error: 'You can only approve users in your organization' }),
        };
      }
    }

    // Check if already approved
    if (userToApprove.approvalStatus === 'approved') {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'User is already approved' }),
      };
    }

    console.log('Approving user:', userId, 'Role:', userToApprove.role);

    // Add user to Cognito group
    await cognitoClient.send(new AdminAddUserToGroupCommand({
      UserPoolId: process.env.USER_POOL_ID,
      Username: userToApprove.email,
      GroupName: userToApprove.role, // Employees, Supervisors, or HRManagers
    }));

    console.log('User added to Cognito group');

    // Update user in DynamoDB
    await docClient.send(new PutCommand({
      TableName: process.env.USERS_TABLE,
      Item: {
        ...userToApprove,
        approvalStatus: 'approved',
        approvedBy: currentUserEmail,
        approvedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    }));

    console.log('User approval status updated in DynamoDB');

    // TODO: Send approval email to user
    // This would use SES to notify the user they've been approved

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'User approved successfully',
      }),
    };
  } catch (error) {
    console.error('Error approving user:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to approve user' }),
    };
  }
}

/**
 * Delete/Reject a user
 */
async function handleDeleteUser(userId, currentUserEmail, currentUserGroups) {
  try {
    const isSuperAdmin = currentUserGroups.includes('SuperAdmins');
    const isOrgAdmin = currentUserGroups.includes('OrgAdmins');

    if (!isOrgAdmin && !isSuperAdmin) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: 'Access denied' }),
      };
    }

    // Get the user
    const userResult = await docClient.send(new GetCommand({
      TableName: process.env.USERS_TABLE,
      Key: { userId },
    }));

    if (!userResult.Item) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'User not found' }),
      };
    }

    const userToDelete = userResult.Item;

    // If OrgAdmin, check they're in the same organization
    if (isOrgAdmin && !isSuperAdmin) {
      const currentUserResult = await docClient.send(new QueryCommand({
        TableName: process.env.USERS_TABLE,
        IndexName: 'EmailIndex',
        KeyConditionExpression: 'email = :email',
        ExpressionAttributeValues: {
          ':email': currentUserEmail,
        },
      }));

      if (!currentUserResult.Items || currentUserResult.Items.length === 0) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'Current user not found' }),
        };
      }

      const currentUser = currentUserResult.Items[0];
      
      if (currentUser.organizationId !== userToDelete.organizationId) {
        return {
          statusCode: 403,
          headers,
          body: JSON.stringify({ error: 'You can only delete users in your organization' }),
        };
      }
    }

    // Delete from Cognito
    try {
      await cognitoClient.send(new AdminDeleteUserCommand({
        UserPoolId: process.env.USER_POOL_ID,
        Username: userToDelete.email,
      }));
      console.log('User deleted from Cognito');
    } catch (cognitoError) {
      console.log('Cognito delete error (may not exist):', cognitoError.message);
      // Continue even if Cognito delete fails - user may not exist yet
    }

    // Delete from DynamoDB
    await docClient.send(new DeleteCommand({
      TableName: process.env.USERS_TABLE,
      Key: { userId },
    }));

    console.log('User deleted from DynamoDB');

    // TODO: Send rejection email to user if they were pending
    // This would use SES to notify the user

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'User deleted successfully',
      }),
    };
  } catch (error) {
    console.error('Error deleting user:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to delete user' }),
    };
  }
}

/**
 * Decode JWT token
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

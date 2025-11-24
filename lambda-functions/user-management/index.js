const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand, UpdateCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');
const { CognitoIdentityProviderClient, AdminCreateUserCommand, AdminDeleteUserCommand, AdminUpdateUserAttributesCommand, AdminSetUserPasswordCommand, AdminAddUserToGroupCommand, AdminRemoveUserFromGroupCommand, AdminListGroupsForUserCommand } = require('@aws-sdk/client-cognito-identity-provider');

const dynamoClient = new DynamoDBClient({ region: process.env.REGION });
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const cognitoClient = new CognitoIdentityProviderClient({ region: process.env.REGION });

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'Content-Type': 'application/json',
};

const ROLE_GROUP_MAP = {
  'hr_manager': 'HRManagers',
  'supervisor': 'Supervisors',
  'employee': 'Employees',
  'org_admin': 'OrgAdmins',
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
    const userOrgId = claims['custom:organizationId'];
    const userEmail = claims.email;

    if (path === '/users' && method === 'GET') {
      return await handleListUsers(event, userGroups, userOrgId);
    }

    if (path === '/users' && method === 'POST') {
      return await handleCreateUser(event, userGroups, userOrgId);
    }

    if (path === '/users/{userId}' && method === 'GET') {
      return await handleGetUser(event, userGroups, userOrgId);
    }

    if (path === '/users/{userId}' && method === 'PUT') {
      return await handleUpdateUser(event, userGroups, userOrgId);
    }

    if (path === '/users/{userId}' && method === 'DELETE') {
      return await handleDeleteUser(event, userGroups, userOrgId);
    }

    if (path === '/users/{userId}/approve' && method === 'POST') {
      return await handleApproveUser(event, userGroups, userOrgId, userEmail);
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

async function handleListUsers(event, userGroups, userOrgId) {
  try {
    // Check permissions: OrgAdmins, HRManagers can list users in their org
    if (!userGroups.includes('SuperAdmins') && 
        !userGroups.includes('OrgAdmins') && 
        !userGroups.includes('HRManagers')) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: 'Insufficient permissions' }),
      };
    }

    const organizationId = event.queryStringParameters?.organizationId || userOrgId;

    // SuperAdmins can query any org, others only their own
    if (!userGroups.includes('SuperAdmins') && organizationId !== userOrgId) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: 'Cannot access users from other organizations' }),
      };
    }

    const result = await docClient.send(new QueryCommand({
      TableName: process.env.USERS_TABLE,
      KeyConditionExpression: 'organizationId = :orgId',
      ExpressionAttributeValues: {
        ':orgId': organizationId,
      },
    }));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        users: result.Items || [],
        count: result.Count,
      }),
    };
  } catch (error) {
    console.error('List users error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to list users' }),
    };
  }
}

async function handleCreateUser(event, userGroups, userOrgId) {
  try {
    // Check permissions: OrgAdmins can create users
    if (!userGroups.includes('SuperAdmins') && !userGroups.includes('OrgAdmins')) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: 'Insufficient permissions' }),
      };
    }

    const body = JSON.parse(event.body);
    const { email, password, fullName, role, department, organizationId } = body;

    if (!email || !password || !fullName || !role) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Email, password, full name, and role are required' }),
      };
    }

    const targetOrgId = organizationId || userOrgId;

    // Non-SuperAdmins can only create users in their own org
    if (!userGroups.includes('SuperAdmins') && targetOrgId !== userOrgId) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: 'Cannot create users in other organizations' }),
      };
    }

    const userGroup = ROLE_GROUP_MAP[role] || 'Employees';

    // Create user in Cognito
    await cognitoClient.send(new AdminCreateUserCommand({
      UserPoolId: process.env.USER_POOL_ID,
      Username: email,
      UserAttributes: [
        { Name: 'email', Value: email },
        { Name: 'email_verified', Value: 'true' },
        { Name: 'name', Value: fullName },
        { Name: 'custom:organizationId', Value: targetOrgId },
        { Name: 'custom:role', Value: role },
        { Name: 'custom:department', Value: department || '' },
        { Name: 'custom:approvalStatus', Value: 'approved' },
      ],
      MessageAction: 'SUPPRESS',
    }));

    // Set permanent password
    await cognitoClient.send(new AdminSetUserPasswordCommand({
      UserPoolId: process.env.USER_POOL_ID,
      Username: email,
      Password: password,
      Permanent: true,
    }));

    // Add to group
    await cognitoClient.send(new AdminAddUserToGroupCommand({
      UserPoolId: process.env.USER_POOL_ID,
      Username: email,
      GroupName: userGroup,
    }));

    // Create in DynamoDB
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = new Date().toISOString();

    const userRecord = {
      organizationId: targetOrgId,
      userId,
      email,
      fullName,
      role,
      department: department || '',
      approvalStatus: 'approved',
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    await docClient.send(new PutCommand({
      TableName: process.env.USERS_TABLE,
      Item: userRecord,
    }));

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({
        message: 'User created successfully',
        user: userRecord,
      }),
    };
  } catch (error) {
    console.error('Create user error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to create user: ' + error.message }),
    };
  }
}

async function handleGetUser(event, userGroups, userOrgId) {
  try {
    const userId = event.pathParameters.userId;
    const organizationId = event.queryStringParameters?.organizationId || userOrgId;

    const result = await docClient.send(new GetCommand({
      TableName: process.env.USERS_TABLE,
      Key: { organizationId, userId },
    }));

    if (!result.Item) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'User not found' }),
      };
    }

    // Check permissions
    if (!userGroups.includes('SuperAdmins') && organizationId !== userOrgId) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: 'Insufficient permissions' }),
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ user: result.Item }),
    };
  } catch (error) {
    console.error('Get user error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to get user' }),
    };
  }
}

async function handleUpdateUser(event, userGroups, userOrgId) {
  try {
    const userId = event.pathParameters.userId;
    const body = JSON.parse(event.body);
    const organizationId = body.organizationId || userOrgId;

    // Check permissions
    if (!userGroups.includes('SuperAdmins') && 
        !userGroups.includes('OrgAdmins') && 
        organizationId !== userOrgId) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: 'Insufficient permissions' }),
      };
    }

    // Get current user
    const currentUser = await docClient.send(new GetCommand({
      TableName: process.env.USERS_TABLE,
      Key: { organizationId, userId },
    }));

    if (!currentUser.Item) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'User not found' }),
      };
    }

    // Update Cognito attributes if provided
    const cognitoUpdates = [];
    if (body.fullName) cognitoUpdates.push({ Name: 'name', Value: body.fullName });
    if (body.role) cognitoUpdates.push({ Name: 'custom:role', Value: body.role });
    if (body.department !== undefined) cognitoUpdates.push({ Name: 'custom:department', Value: body.department });

    if (cognitoUpdates.length > 0) {
      await cognitoClient.send(new AdminUpdateUserAttributesCommand({
        UserPoolId: process.env.USER_POOL_ID,
        Username: currentUser.Item.email,
        UserAttributes: cognitoUpdates,
      }));
    }

    // Update group if role changed
    if (body.role && body.role !== currentUser.Item.role) {
      const oldGroup = ROLE_GROUP_MAP[currentUser.Item.role];
      const newGroup = ROLE_GROUP_MAP[body.role];

      if (oldGroup) {
        await cognitoClient.send(new AdminRemoveUserFromGroupCommand({
          UserPoolId: process.env.USER_POOL_ID,
          Username: currentUser.Item.email,
          GroupName: oldGroup,
        }));
      }

      if (newGroup) {
        await cognitoClient.send(new AdminAddUserToGroupCommand({
          UserPoolId: process.env.USER_POOL_ID,
          Username: currentUser.Item.email,
          GroupName: newGroup,
        }));
      }
    }

    // Update DynamoDB
    const updateExpressions = [];
    const expressionAttributeNames = {};
    const expressionAttributeValues = {};

    const allowedFields = ['fullName', 'role', 'department'];
    
    allowedFields.forEach(field => {
      if (body[field] !== undefined) {
        updateExpressions.push(`#${field} = :${field}`);
        expressionAttributeNames[`#${field}`] = field;
        expressionAttributeValues[`:${field}`] = body[field];
      }
    });

    updateExpressions.push('#updatedAt = :updatedAt');
    expressionAttributeNames['#updatedAt'] = 'updatedAt';
    expressionAttributeValues[':updatedAt'] = new Date().toISOString();

    const result = await docClient.send(new UpdateCommand({
      TableName: process.env.USERS_TABLE,
      Key: { organizationId, userId },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW',
    }));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'User updated successfully',
        user: result.Attributes,
      }),
    };
  } catch (error) {
    console.error('Update user error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to update user' }),
    };
  }
}

async function handleDeleteUser(event, userGroups, userOrgId) {
  try {
    // Check permissions: OrgAdmins can delete users
    if (!userGroups.includes('SuperAdmins') && !userGroups.includes('OrgAdmins')) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: 'Insufficient permissions' }),
      };
    }

    const userId = event.pathParameters.userId;
    const organizationId = event.queryStringParameters?.organizationId || userOrgId;

    // Get user
    const user = await docClient.send(new GetCommand({
      TableName: process.env.USERS_TABLE,
      Key: { organizationId, userId },
    }));

    if (!user.Item) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'User not found' }),
      };
    }

    // Delete from Cognito
    await cognitoClient.send(new AdminDeleteUserCommand({
      UserPoolId: process.env.USER_POOL_ID,
      Username: user.Item.email,
    }));

    // Delete from DynamoDB
    await docClient.send(new DeleteCommand({
      TableName: process.env.USERS_TABLE,
      Key: { organizationId, userId },
    }));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'User deleted successfully' }),
    };
  } catch (error) {
    console.error('Delete user error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to delete user' }),
    };
  }
}

async function handleApproveUser(event, userGroups, userOrgId, approverEmail) {
  try {
    // Check permissions: OrgAdmins can approve users
    if (!userGroups.includes('SuperAdmins') && !userGroups.includes('OrgAdmins')) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: 'Insufficient permissions' }),
      };
    }

    const userId = event.pathParameters.userId;
    const organizationId = event.queryStringParameters?.organizationId || userOrgId;

    // Get user
    const user = await docClient.send(new GetCommand({
      TableName: process.env.USERS_TABLE,
      Key: { organizationId, userId },
    }));

    if (!user.Item) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'User not found' }),
      };
    }

    // Update Cognito
    await cognitoClient.send(new AdminUpdateUserAttributesCommand({
      UserPoolId: process.env.USER_POOL_ID,
      Username: user.Item.email,
      UserAttributes: [
        { Name: 'custom:approvalStatus', Value: 'approved' },
      ],
    }));

    // Update DynamoDB
    await docClient.send(new UpdateCommand({
      TableName: process.env.USERS_TABLE,
      Key: { organizationId, userId },
      UpdateExpression: 'SET #approvalStatus = :approved, #approvedBy = :approver, #updatedAt = :updatedAt',
      ExpressionAttributeNames: {
        '#approvalStatus': 'approvalStatus',
        '#approvedBy': 'approvedBy',
        '#updatedAt': 'updatedAt',
      },
      ExpressionAttributeValues: {
        ':approved': 'approved',
        ':approver': approverEmail,
        ':updatedAt': new Date().toISOString(),
      },
    }));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'User approved successfully',
        userId,
      }),
    };
  } catch (error) {
    console.error('Approve user error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to approve user' }),
    };
  }
}

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand, UpdateCommand, DeleteCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');
const { CognitoIdentityProviderClient, AdminUpdateUserAttributesCommand } = require('@aws-sdk/client-cognito-identity-provider');

const dynamoClient = new DynamoDBClient({ region: process.env.REGION });
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const cognitoClient = new CognitoIdentityProviderClient({ region: process.env.REGION });

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

    if (method === 'OPTIONS') {
      return { statusCode: 200, headers, body: '' };
    }

    // Check user role from JWT claims
    const claims = event.requestContext.authorizer.claims;
    const userGroups = claims['cognito:groups'] ? claims['cognito:groups'].split(',') : [];
    const userEmail = claims.email;

    // Route handlers
    if (path === '/organizations' && method === 'GET') {
      return await handleListOrganizations(userGroups);
    }

    if (path === '/organizations' && method === 'POST') {
      return await handleCreateOrganization(event, userGroups);
    }

    if (path === '/organizations/{organizationId}' && method === 'GET') {
      return await handleGetOrganization(event, userGroups);
    }

    if (path === '/organizations/{organizationId}' && method === 'PUT') {
      return await handleUpdateOrganization(event, userGroups);
    }

    if (path === '/organizations/{organizationId}' && method === 'DELETE') {
      return await handleDeleteOrganization(event, userGroups);
    }

    if (path === '/organizations/{organizationId}/approve' && method === 'POST') {
      return await handleApproveOrganization(event, userGroups, userEmail);
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

async function handleListOrganizations(userGroups) {
  try {
    // Only SuperAdmins can list all organizations
    if (!userGroups.includes('SuperAdmins')) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: 'Insufficient permissions' }),
      };
    }

    const result = await docClient.send(new ScanCommand({
      TableName: process.env.ORGANIZATIONS_TABLE,
    }));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        organizations: result.Items || [],
        count: result.Count,
      }),
    };
  } catch (error) {
    console.error('List organizations error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to list organizations' }),
    };
  }
}

async function handleCreateOrganization(event, userGroups) {
  try {
    // Only SuperAdmins can create organizations directly
    if (!userGroups.includes('SuperAdmins')) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: 'Insufficient permissions' }),
      };
    }

    const body = JSON.parse(event.body);
    const { name, subdomain, adminEmail, description } = body;

    if (!name || !subdomain || !adminEmail) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Name, subdomain, and admin email are required' }),
      };
    }

    const orgId = `org_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = new Date().toISOString();

    const organization = {
      organizationId: orgId,
      name,
      subdomain: subdomain.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
      adminEmail,
      description: description || '',
      status: 'active',
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    await docClient.send(new PutCommand({
      TableName: process.env.ORGANIZATIONS_TABLE,
      Item: organization,
    }));

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({
        message: 'Organization created successfully',
        organization,
      }),
    };
  } catch (error) {
    console.error('Create organization error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to create organization' }),
    };
  }
}

async function handleGetOrganization(event, userGroups) {
  try {
    const organizationId = event.pathParameters.organizationId;

    const result = await docClient.send(new GetCommand({
      TableName: process.env.ORGANIZATIONS_TABLE,
      Key: { organizationId },
    }));

    if (!result.Item) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Organization not found' }),
      };
    }

    // Check permissions: SuperAdmins or OrgAdmins of this org
    const claims = event.requestContext.authorizer.claims;
    const userOrgId = claims['custom:organizationId'];

    if (!userGroups.includes('SuperAdmins') && userOrgId !== organizationId) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: 'Insufficient permissions' }),
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ organization: result.Item }),
    };
  } catch (error) {
    console.error('Get organization error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to get organization' }),
    };
  }
}

async function handleUpdateOrganization(event, userGroups) {
  try {
    const organizationId = event.pathParameters.organizationId;
    const body = JSON.parse(event.body);

    // Check permissions
    const claims = event.requestContext.authorizer.claims;
    const userOrgId = claims['custom:organizationId'];

    if (!userGroups.includes('SuperAdmins') && 
        !(userGroups.includes('OrgAdmins') && userOrgId === organizationId)) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: 'Insufficient permissions' }),
      };
    }

    // Build update expression
    const updateExpressions = [];
    const expressionAttributeNames = {};
    const expressionAttributeValues = {};

    const allowedFields = ['name', 'description', 'status'];
    
    allowedFields.forEach(field => {
      if (body[field] !== undefined) {
        updateExpressions.push(`#${field} = :${field}`);
        expressionAttributeNames[`#${field}`] = field;
        expressionAttributeValues[`:${field}`] = body[field];
      }
    });

    if (updateExpressions.length === 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'No valid fields to update' }),
      };
    }

    updateExpressions.push('#updatedAt = :updatedAt');
    expressionAttributeNames['#updatedAt'] = 'updatedAt';
    expressionAttributeValues[':updatedAt'] = new Date().toISOString();

    const result = await docClient.send(new UpdateCommand({
      TableName: process.env.ORGANIZATIONS_TABLE,
      Key: { organizationId },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW',
    }));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'Organization updated successfully',
        organization: result.Attributes,
      }),
    };
  } catch (error) {
    console.error('Update organization error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to update organization' }),
    };
  }
}

async function handleDeleteOrganization(event, userGroups) {
  try {
    // Only SuperAdmins can delete organizations
    if (!userGroups.includes('SuperAdmins')) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: 'Insufficient permissions' }),
      };
    }

    const organizationId = event.pathParameters.organizationId;

    await docClient.send(new DeleteCommand({
      TableName: process.env.ORGANIZATIONS_TABLE,
      Key: { organizationId },
    }));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'Organization deleted successfully' }),
    };
  } catch (error) {
    console.error('Delete organization error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to delete organization' }),
    };
  }
}

async function handleApproveOrganization(event, userGroups, adminEmail) {
  try {
    // Only SuperAdmins can approve organizations
    if (!userGroups.includes('SuperAdmins')) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: 'Insufficient permissions' }),
      };
    }

    const organizationId = event.pathParameters.organizationId;

    // Get organization
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

    const organization = orgResult.Item;

    // Update organization status
    await docClient.send(new UpdateCommand({
      TableName: process.env.ORGANIZATIONS_TABLE,
      Key: { organizationId },
      UpdateExpression: 'SET #status = :status, #updatedAt = :updatedAt, #approvedBy = :approvedBy',
      ExpressionAttributeNames: {
        '#status': 'status',
        '#updatedAt': 'updatedAt',
        '#approvedBy': 'approvedBy',
      },
      ExpressionAttributeValues: {
        ':status': 'active',
        ':updatedAt': new Date().toISOString(),
        ':approvedBy': adminEmail,
      },
    }));

    // Update admin user's approval status in Cognito
    await cognitoClient.send(new AdminUpdateUserAttributesCommand({
      UserPoolId: process.env.USER_POOL_ID,
      Username: organization.adminEmail,
      UserAttributes: [
        { Name: 'custom:approvalStatus', Value: 'approved' },
        { Name: 'custom:organizationId', Value: organizationId },
      ],
    }));

    // Update admin user in DynamoDB
    if (organization.adminUserId) {
      await docClient.send(new UpdateCommand({
        TableName: process.env.USERS_TABLE,
        Key: {
          organizationId,
          userId: organization.adminUserId,
        },
        UpdateExpression: 'SET #approvalStatus = :approved, #updatedAt = :updatedAt',
        ExpressionAttributeNames: {
          '#approvalStatus': 'approvalStatus',
          '#updatedAt': 'updatedAt',
        },
        ExpressionAttributeValues: {
          ':approved': 'approved',
          ':updatedAt': new Date().toISOString(),
        },
      }));
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'Organization approved successfully',
        organizationId,
      }),
    };
  } catch (error) {
    console.error('Approve organization error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to approve organization' }),
    };
  }
}

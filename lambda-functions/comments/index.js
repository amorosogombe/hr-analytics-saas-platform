const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand, UpdateCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');

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

    if (method === 'OPTIONS') {
      return { statusCode: 200, headers, body: '' };
    }

    const claims = event.requestContext.authorizer.claims;
    const userGroups = claims['cognito:groups'] ? claims['cognito:groups'].split(',') : [];
    const userEmail = claims.email;
    const userId = claims.sub;
    const organizationId = claims['custom:organizationId'];

    if (path === '/comments' && method === 'GET') {
      return await handleListComments(event, organizationId, userId, userGroups);
    }

    if (path === '/comments' && method === 'POST') {
      return await handleCreateComment(event, organizationId, userId, userEmail, userGroups);
    }

    if (path === '/comments/{commentId}' && method === 'GET') {
      return await handleGetComment(event, organizationId, userId, userGroups);
    }

    if (path === '/comments/{commentId}' && method === 'PUT') {
      return await handleUpdateComment(event, organizationId, userId, userGroups);
    }

    if (path === '/comments/{commentId}' && method === 'DELETE') {
      return await handleDeleteComment(event, organizationId, userId, userGroups);
    }

    if (path === '/comments/{commentId}/approve' && method === 'POST') {
      return await handleApproveComment(event, organizationId, userEmail, userGroups);
    }

    if (path === '/comments/{commentId}/disapprove' && method === 'POST') {
      return await handleDisapproveComment(event, organizationId, userEmail, userGroups);
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

async function handleListComments(event, organizationId, userId, userGroups) {
  try {
    const { dashboardId, metricId, status } = event.queryStringParameters || {};

    // Build query key
    let pk = `ORG#${organizationId}`;
    if (dashboardId) pk += `#DASH#${dashboardId}`;
    if (metricId) pk += `#METRIC#${metricId}`;

    const queryParams = {
      TableName: process.env.COMMENTS_TABLE,
      KeyConditionExpression: 'PK = :pk',
      ExpressionAttributeValues: {
        ':pk': pk,
      },
    };

    // Add filter for status if provided
    if (status) {
      queryParams.FilterExpression = '#status = :status';
      queryParams.ExpressionAttributeNames = { '#status': 'status' };
      queryParams.ExpressionAttributeValues[':status'] = status;
    }

    const result = await docClient.send(new QueryCommand(queryParams));

    // Filter comments based on role
    let comments = result.Items || [];
    
    // Employees can only see their own comments (unless viewing all metrics)
    if (!userGroups.includes('SuperAdmins') && 
        !userGroups.includes('OrgAdmins') && 
        !userGroups.includes('HRManagers') && 
        !userGroups.includes('Supervisors')) {
      comments = comments.filter(c => c.userId === userId);
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        comments,
        count: comments.length,
      }),
    };
  } catch (error) {
    console.error('List comments error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to list comments' }),
    };
  }
}

async function handleCreateComment(event, organizationId, userId, userEmail, userGroups) {
  try {
    const body = JSON.parse(event.body);
    const { dashboardId, metricId, content, metricType } = body;

    if (!dashboardId || !metricId || !content) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Dashboard ID, metric ID, and content are required' }),
      };
    }

    // Check comment permissions based on role and metric ownership
    const canCommentOnAll = userGroups.includes('SuperAdmins') || 
                            userGroups.includes('OrgAdmins') || 
                            userGroups.includes('HRManagers') || 
                            userGroups.includes('Supervisors');

    // Employees can only comment on own metrics
    if (!canCommentOnAll && metricType !== 'own') {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: 'Employees can only comment on their own metrics' }),
      };
    }

    const commentId = `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = new Date().toISOString();

    // PK: ORG#orgId#DASH#dashboardId#METRIC#metricId
    // SK: COMMENT#timestamp#commentId
    const comment = {
      PK: `ORG#${organizationId}#DASH#${dashboardId}#METRIC#${metricId}`,
      SK: `COMMENT#${timestamp}#${commentId}`,
      commentId,
      organizationId,
      dashboardId,
      metricId,
      userId,
      userEmail,
      content,
      status: 'pending', // pending, approved, rejected
      createdAt: timestamp,
      updatedAt: timestamp,
      ttl: Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60), // 1 year TTL
    };

    await docClient.send(new PutCommand({
      TableName: process.env.COMMENTS_TABLE,
      Item: comment,
    }));

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({
        message: 'Comment created successfully',
        comment,
      }),
    };
  } catch (error) {
    console.error('Create comment error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to create comment' }),
    };
  }
}

async function handleGetComment(event, organizationId, userId, userGroups) {
  try {
    const commentId = event.pathParameters.commentId;
    const { dashboardId, metricId } = event.queryStringParameters || {};

    if (!dashboardId || !metricId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Dashboard ID and metric ID are required' }),
      };
    }

    const pk = `ORG#${organizationId}#DASH#${dashboardId}#METRIC#${metricId}`;

    // Query to find the comment
    const result = await docClient.send(new QueryCommand({
      TableName: process.env.COMMENTS_TABLE,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': pk,
        ':sk': 'COMMENT#',
      },
    }));

    const comment = (result.Items || []).find(c => c.commentId === commentId);

    if (!comment) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Comment not found' }),
      };
    }

    // Check permissions
    const canViewAll = userGroups.includes('SuperAdmins') || 
                       userGroups.includes('OrgAdmins') || 
                       userGroups.includes('HRManagers') || 
                       userGroups.includes('Supervisors');

    if (!canViewAll && comment.userId !== userId) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: 'Insufficient permissions' }),
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ comment }),
    };
  } catch (error) {
    console.error('Get comment error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to get comment' }),
    };
  }
}

async function handleUpdateComment(event, organizationId, userId, userGroups) {
  try {
    const commentId = event.pathParameters.commentId;
    const body = JSON.parse(event.body);
    const { dashboardId, metricId, content } = body;

    if (!dashboardId || !metricId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Dashboard ID and metric ID are required' }),
      };
    }

    const pk = `ORG#${organizationId}#DASH#${dashboardId}#METRIC#${metricId}`;

    // Get current comment
    const result = await docClient.send(new QueryCommand({
      TableName: process.env.COMMENTS_TABLE,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': pk,
        ':sk': 'COMMENT#',
      },
    }));

    const comment = (result.Items || []).find(c => c.commentId === commentId);

    if (!comment) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Comment not found' }),
      };
    }

    // Only comment owner can edit
    if (comment.userId !== userId) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: 'You can only edit your own comments' }),
      };
    }

    // Update comment
    const updateResult = await docClient.send(new UpdateCommand({
      TableName: process.env.COMMENTS_TABLE,
      Key: { PK: comment.PK, SK: comment.SK },
      UpdateExpression: 'SET #content = :content, #updatedAt = :updatedAt',
      ExpressionAttributeNames: {
        '#content': 'content',
        '#updatedAt': 'updatedAt',
      },
      ExpressionAttributeValues: {
        ':content': content,
        ':updatedAt': new Date().toISOString(),
      },
      ReturnValues: 'ALL_NEW',
    }));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'Comment updated successfully',
        comment: updateResult.Attributes,
      }),
    };
  } catch (error) {
    console.error('Update comment error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to update comment' }),
    };
  }
}

async function handleDeleteComment(event, organizationId, userId, userGroups) {
  try {
    const commentId = event.pathParameters.commentId;
    const { dashboardId, metricId } = event.queryStringParameters || {};

    if (!dashboardId || !metricId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Dashboard ID and metric ID are required' }),
      };
    }

    // Check delete permissions: HR Managers and Org Admins
    const canDelete = userGroups.includes('SuperAdmins') || 
                     userGroups.includes('OrgAdmins') || 
                     userGroups.includes('HRManagers');

    if (!canDelete) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: 'Insufficient permissions to delete comments' }),
      };
    }

    const pk = `ORG#${organizationId}#DASH#${dashboardId}#METRIC#${metricId}`;

    // Get comment
    const result = await docClient.send(new QueryCommand({
      TableName: process.env.COMMENTS_TABLE,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': pk,
        ':sk': 'COMMENT#',
      },
    }));

    const comment = (result.Items || []).find(c => c.commentId === commentId);

    if (!comment) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Comment not found' }),
      };
    }

    // Delete comment
    await docClient.send(new DeleteCommand({
      TableName: process.env.COMMENTS_TABLE,
      Key: { PK: comment.PK, SK: comment.SK },
    }));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'Comment deleted successfully' }),
    };
  } catch (error) {
    console.error('Delete comment error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to delete comment' }),
    };
  }
}

async function handleApproveComment(event, organizationId, approverEmail, userGroups) {
  try {
    // Only Supervisors and above can approve comments
    const canApprove = userGroups.includes('SuperAdmins') || 
                      userGroups.includes('OrgAdmins') || 
                      userGroups.includes('HRManagers') || 
                      userGroups.includes('Supervisors');

    if (!canApprove) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: 'Insufficient permissions to approve comments' }),
      };
    }

    const commentId = event.pathParameters.commentId;
    const body = JSON.parse(event.body);
    const { dashboardId, metricId } = body;

    const pk = `ORG#${organizationId}#DASH#${dashboardId}#METRIC#${metricId}`;

    // Get comment
    const result = await docClient.send(new QueryCommand({
      TableName: process.env.COMMENTS_TABLE,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': pk,
        ':sk': 'COMMENT#',
      },
    }));

    const comment = (result.Items || []).find(c => c.commentId === commentId);

    if (!comment) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Comment not found' }),
      };
    }

    // Update comment status
    await docClient.send(new UpdateCommand({
      TableName: process.env.COMMENTS_TABLE,
      Key: { PK: comment.PK, SK: comment.SK },
      UpdateExpression: 'SET #status = :status, #approvedBy = :approver, #approvedAt = :approvedAt, #updatedAt = :updatedAt',
      ExpressionAttributeNames: {
        '#status': 'status',
        '#approvedBy': 'approvedBy',
        '#approvedAt': 'approvedAt',
        '#updatedAt': 'updatedAt',
      },
      ExpressionAttributeValues: {
        ':status': 'approved',
        ':approver': approverEmail,
        ':approvedAt': new Date().toISOString(),
        ':updatedAt': new Date().toISOString(),
      },
    }));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'Comment approved successfully',
        commentId,
      }),
    };
  } catch (error) {
    console.error('Approve comment error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to approve comment' }),
    };
  }
}

async function handleDisapproveComment(event, organizationId, approverEmail, userGroups) {
  try {
    // Only Supervisors and above can disapprove comments
    const canDisapprove = userGroups.includes('SuperAdmins') || 
                         userGroups.includes('OrgAdmins') || 
                         userGroups.includes('HRManagers') || 
                         userGroups.includes('Supervisors');

    if (!canDisapprove) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: 'Insufficient permissions to disapprove comments' }),
      };
    }

    const commentId = event.pathParameters.commentId;
    const body = JSON.parse(event.body);
    const { dashboardId, metricId, reason } = body;

    const pk = `ORG#${organizationId}#DASH#${dashboardId}#METRIC#${metricId}`;

    // Get comment
    const result = await docClient.send(new QueryCommand({
      TableName: process.env.COMMENTS_TABLE,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': pk,
        ':sk': 'COMMENT#',
      },
    }));

    const comment = (result.Items || []).find(c => c.commentId === commentId);

    if (!comment) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Comment not found' }),
      };
    }

    // Update comment status
    await docClient.send(new UpdateCommand({
      TableName: process.env.COMMENTS_TABLE,
      Key: { PK: comment.PK, SK: comment.SK },
      UpdateExpression: 'SET #status = :status, #disapprovedBy = :disapprover, #disapprovalReason = :reason, #disapprovedAt = :disapprovedAt, #updatedAt = :updatedAt',
      ExpressionAttributeNames: {
        '#status': 'status',
        '#disapprovedBy': 'disapprovedBy',
        '#disapprovalReason': 'disapprovalReason',
        '#disapprovedAt': 'disapprovedAt',
        '#updatedAt': 'updatedAt',
      },
      ExpressionAttributeValues: {
        ':status': 'rejected',
        ':disapprover': approverEmail,
        ':reason': reason || 'No reason provided',
        ':disapprovedAt': new Date().toISOString(),
        ':updatedAt': new Date().toISOString(),
      },
    }));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'Comment disapproved successfully',
        commentId,
      }),
    };
  } catch (error) {
    console.error('Disapprove comment error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to disapprove comment' }),
    };
  }
}

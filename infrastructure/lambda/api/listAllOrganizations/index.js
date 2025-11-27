const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
  console.log('Event:', JSON.stringify(event, null, 2));

  try {
    const groups = event.identity?.claims['cognito:groups'] || [];
    if (!groups.includes('SuperAdmins')) {
      throw new Error('Unauthorized: Super Admin access required');
    }

    const { status, limit = 20, nextToken } = event.arguments;

    let params = {
      TableName: process.env.ORGANIZATIONS_TABLE,
      Limit: limit,
    };

    if (status) {
      params = {
        ...params,
        IndexName: 'StatusIndex',
        KeyConditionExpression: '#status = :status',
        ExpressionAttributeNames: {
          '#status': 'status',
        },
        ExpressionAttributeValues: {
          ':status': status,
        },
      };

      if (nextToken) {
        params.ExclusiveStartKey = JSON.parse(
          Buffer.from(nextToken, 'base64').toString()
        );
      }

      const command = new QueryCommand(params);
      const result = await docClient.send(command);

      return {
        items: result.Items || [],
        nextToken: result.LastEvaluatedKey
          ? Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString('base64')
          : null,
      };
    } else {
      if (nextToken) {
        params.ExclusiveStartKey = JSON.parse(
          Buffer.from(nextToken, 'base64').toString()
        );
      }

      const command = new ScanCommand(params);
      const result = await docClient.send(command);

      return {
        items: result.Items || [],
        nextToken: result.LastEvaluatedKey
          ? Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString('base64')
          : null,
      };
    }
  } catch (error) {
    console.error('Error listing organizations:', error);
    throw error;
  }
};

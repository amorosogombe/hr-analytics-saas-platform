const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const sesClient = new SESClient({});

exports.handler = async (event) => {
  console.log('Event:', JSON.stringify(event, null, 2));

  try {
    const groups = event.identity?.claims['cognito:groups'] || [];
    const adminEmail = event.identity?.claims?.email;

    if (!groups.includes('SuperAdmins')) {
      throw new Error('Unauthorized: Super Admin access required');
    }

    const { organizationId, reason } = event.arguments;

    if (!reason) {
      throw new Error('Reason is required for suspension');
    }

    const getCommand = new GetCommand({
      TableName: process.env.ORGANIZATIONS_TABLE,
      Key: { organizationId },
    });
    const orgResult = await docClient.send(getCommand);

    if (!orgResult.Item) {
      throw new Error('Organization not found');
    }

    const organization = orgResult.Item;

    const timestamp = new Date().toISOString();
    const updateCommand = new UpdateCommand({
      TableName: process.env.ORGANIZATIONS_TABLE,
      Key: { organizationId },
      UpdateExpression: 'SET #status = :status, suspendedAt = :timestamp, suspendedBy = :suspendedBy, suspensionReason = :reason, updatedAt = :updatedAt',
      ExpressionAttributeNames: {
        '#status': 'status',
      },
      ExpressionAttributeValues: {
        ':status': 'SUSPENDED',
        ':timestamp': timestamp,
        ':suspendedBy': adminEmail,
        ':reason': reason,
        ':updatedAt': timestamp,
      },
      ReturnValues: 'ALL_NEW',
    });

    const updateResult = await docClient.send(updateCommand);

    try {
      const emailCommand = new SendEmailCommand({
        Source: process.env.FROM_EMAIL || 'noreply@a1strategy.net',
        Destination: {
          ToAddresses: [organization.adminEmail],
        },
        Message: {
          Subject: {
            Data: 'Account Suspension Notice',
          },
          Body: {
            Html: {
              Data: `
                <html>
                  <body style="font-family: Arial, sans-serif;">
                    <h2>Account Suspension Notice</h2>
                    <p>Your organization "${organization.name}" has been suspended.</p>
                    <p>Reason: ${reason}</p>
                  </body>
                </html>
              `,
            },
          },
        },
      });

      await sesClient.send(emailCommand);
    } catch (emailError) {
      console.error('Error sending email:', emailError);
    }

    return updateResult.Attributes;
  } catch (error) {
    console.error('Error suspending organization:', error);
    throw error;
  }
};

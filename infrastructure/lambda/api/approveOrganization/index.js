const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');
const { CognitoIdentityProviderClient, AdminCreateUserCommand, AdminAddUserToGroupCommand } = require('@aws-sdk/client-cognito-identity-provider');

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const sesClient = new SESClient({});
const cognitoClient = new CognitoIdentityProviderClient({});

exports.handler = async (event) => {
  console.log('Event:', JSON.stringify(event, null, 2));

  try {
    const groups = event.identity?.claims['cognito:groups'] || [];
    const adminEmail = event.identity?.claims?.email;

    if (!groups.includes('SuperAdmins')) {
      throw new Error('Unauthorized: Super Admin access required');
    }

    const { organizationId } = event.arguments;

    const getCommand = new GetCommand({
      TableName: process.env.ORGANIZATIONS_TABLE,
      Key: { organizationId },
    });
    const orgResult = await docClient.send(getCommand);

    if (!orgResult.Item) {
      throw new Error('Organization not found');
    }

    const organization = orgResult.Item;

    if (organization.status !== 'PENDING') {
      throw new Error(`Organization is not pending approval. Current status: ${organization.status}`);
    }

    const timestamp = new Date().toISOString();
    const updateCommand = new UpdateCommand({
      TableName: process.env.ORGANIZATIONS_TABLE,
      Key: { organizationId },
      UpdateExpression: 'SET #status = :status, approvedAt = :timestamp, approvedBy = :approvedBy, updatedAt = :updatedAt',
      ExpressionAttributeNames: {
        '#status': 'status',
      },
      ExpressionAttributeValues: {
        ':status': 'ACTIVE',
        ':timestamp': timestamp,
        ':approvedBy': adminEmail,
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
            Data: 'Your Organization Has Been Approved! 🎉',
          },
          Body: {
            Html: {
              Data: `
                <html>
                  <body style="font-family: Arial, sans-serif;">
                    <h2>Welcome to HR Analytics Platform!</h2>
                    <p>Your organization "${organization.name}" has been approved.</p>
                    <p>Access your portal at: https://main.d3qkcpei6eyseu.amplifyapp.com</p>
                  </body>
                </html>
              `,
            },
          },
        },
      });

      await sesClient.send(emailCommand);
      console.log('Approval email sent successfully');
    } catch (emailError) {
      console.error('Error sending email:', emailError);
    }

    return updateResult.Attributes;
  } catch (error) {
    console.error('Error approving organization:', error);
    throw error;
  }
};

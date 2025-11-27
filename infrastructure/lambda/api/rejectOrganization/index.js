const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');
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

    const getCommand = new GetCommand({
      TableName: process.env.ORGANIZATIONS_TABLE,
      Key: { organizationId },
    });
    const orgResult = await docClient.send(getCommand);

    if (!orgResult.Item) {
      throw new Error('Organization not found');
    }

    const organization = orgResult.Item;

    const deleteCommand = new DeleteCommand({
      TableName: process.env.ORGANIZATIONS_TABLE,
      Key: { organizationId },
    });
    await docClient.send(deleteCommand);

    try {
      const emailCommand = new SendEmailCommand({
        Source: process.env.FROM_EMAIL || 'noreply@a1strategy.net',
        Destination: {
          ToAddresses: [organization.adminEmail],
        },
        Message: {
          Subject: {
            Data: 'Organization Application Status',
          },
          Body: {
            Html: {
              Data: `
                <html>
                  <body style="font-family: Arial, sans-serif;">
                    <h2>Organization Application Update</h2>
                    <p>Unfortunately, we are unable to approve "${organization.name}" at this time.</p>
                    ${reason ? `<p>Reason: ${reason}</p>` : ''}
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

    return true;
  } catch (error) {
    console.error('Error rejecting organization:', error);
    throw error;
  }
};

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');
const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const sesClient = new SESClient({});

exports.handler = async (event) => {
  console.log('Event:', JSON.stringify(event, null, 2));

  try {
    const { input } = event.arguments;
    const { name, subdomain, adminEmail, tier, companySize, industry } = input;

    if (!/^[a-z0-9-]+$/.test(subdomain)) {
      throw new Error('Invalid subdomain format');
    }

    const organizationId = subdomain;
    const timestamp = new Date().toISOString();

    const organization = {
      organizationId,
      name,
      subdomain,
      status: 'PENDING',
      tier,
      adminEmail,
      companySize,
      industry,
      userCount: 0,
      dataSourcesConfigured: false,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    const putCommand = new PutCommand({
      TableName: process.env.ORGANIZATIONS_TABLE,
      Item: organization,
      ConditionExpression: 'attribute_not_exists(organizationId)',
    });

    await docClient.send(putCommand);

    try {
      const emailCommand = new SendEmailCommand({
        Source: process.env.FROM_EMAIL || 'noreply@a1strategy.net',
        Destination: {
          ToAddresses: [process.env.ADMIN_EMAIL || 'admin@a1strategy.net'],
        },
        Message: {
          Subject: {
            Data: 'New Organization Registration',
          },
          Body: {
            Html: {
              Data: `
                <html>
                  <body>
                    <h2>New Organization Registration</h2>
                    <p>Name: ${name}</p>
                    <p>Subdomain: ${subdomain}</p>
                    <p>Admin: ${adminEmail}</p>
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

    return organization;
  } catch (error) {
    console.error('Error creating organization:', error);
    throw error;
  }
};

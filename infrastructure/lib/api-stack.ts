// infrastructure/lib/api-stack.ts
import * as cdk from 'aws-cdk-lib';
import * as appsync from 'aws-cdk-lib/aws-appsync';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import * as path from 'path';

export interface ApiStackProps extends cdk.StackProps {
  userPool: cognito.UserPool;
  tables: { [key: string]: dynamodb.Table };
}

export class ApiStack extends cdk.Stack {
  public readonly api: appsync.GraphqlApi;
  public readonly resolvers: { [key: string]: lambda.Function };

  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    console.log('🔌 Creating AppSync GraphQL API...');

    this.resolvers = {};

    // AppSync GraphQL API
    this.api = new appsync.GraphqlApi(this, 'HRAnalyticsAPI', {
      name: 'hr-analytics-api',
      definition: appsync.Definition.fromFile(
        path.join(__dirname, '../graphql/schema.graphql')
      ),
      authorizationConfig: {
        defaultAuthorization: {
          authorizationType: appsync.AuthorizationType.USER_POOL,
          userPoolConfig: {
            userPool: props.userPool,
          },
        },
        additionalAuthorizationModes: [
          {
            authorizationType: appsync.AuthorizationType.IAM,
          },
        ],
      },
      xrayEnabled: true,
      logConfig: {
        fieldLogLevel: appsync.FieldLogLevel.ERROR,
        excludeVerboseContent: false,
      },
    });

    // DynamoDB Data Sources
    const orgDataSource = this.api.addDynamoDbDataSource(
      'OrganizationsDataSource',
      props.tables.organizations
    );

    const usersDataSource = this.api.addDynamoDbDataSource(
      'UsersDataSource',
      props.tables.users
    );

    const commentsDataSource = this.api.addDynamoDbDataSource(
      'CommentsDataSource',
      props.tables.comments
    );

    // Lambda Resolvers for Super Admin Operations
    this.createLambdaResolver(
      'ListAllOrganizations',
      'listAllOrganizations',
      'Query',
      props.tables.organizations,
      ['SuperAdmins']
    );

    this.createLambdaResolver(
      'GetSystemMetrics',
      'getSystemMetrics',
      'Query',
      props.tables.organizations,
      ['SuperAdmins']
    );

    this.createLambdaResolver(
      'ApproveOrganization',
      'approveOrganization',
      'Mutation',
      props.tables.organizations,
      ['SuperAdmins']
    );

    this.createLambdaResolver(
      'RejectOrganization',
      'rejectOrganization',
      'Mutation',
      props.tables.organizations,
      ['SuperAdmins']
    );

    this.createLambdaResolver(
      'SuspendOrganization',
      'suspendOrganization',
      'Mutation',
      props.tables.organizations,
      ['SuperAdmins']
    );

    // Direct DynamoDB Resolvers (no Lambda needed)
    // Get Organization
    orgDataSource.createResolver('GetOrganizationResolver', {
      typeName: 'Query',
      fieldName: 'getOrganization',
      requestMappingTemplate: appsync.MappingTemplate.dynamoDbGetItem(
        'organizationId',
        'organizationId'
      ),
      responseMappingTemplate: appsync.MappingTemplate.dynamoDbResultItem(),
    });

    // Create Organization
    this.createLambdaResolver(
      'CreateOrganization',
      'createOrganization',
      'Mutation',
      props.tables.organizations,
      ['SuperAdmins']
    );

    // Outputs
    new cdk.CfnOutput(this, 'GraphQLAPIURL', {
      value: this.api.graphqlUrl,
      description: 'AppSync GraphQL API URL',
      exportName: 'HRAnalytics-GraphQLAPIURL',
    });

    new cdk.CfnOutput(this, 'GraphQLAPIKey', {
      value: this.api.apiKey || 'N/A',
      description: 'AppSync API Key (if enabled)',
      exportName: 'HRAnalytics-GraphQLAPIKey',
    });

    console.log('✅ AppSync GraphQL API created successfully');
  }

  private createLambdaResolver(
    id: string,
    functionName: string,
    typeName: string,
    table: dynamodb.Table,
    allowedGroups: string[]
  ) {
    // Create Lambda function
    const lambdaFunction = new lambda.Function(this, `${id}Lambda`, {
      functionName: `hr-analytics-${functionName}`,
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(
        path.join(__dirname, `../lambda/api/${functionName}`)
      ),
      timeout: cdk.Duration.seconds(30),
      memorySize: 1024,
      environment: {
        ORGANIZATIONS_TABLE: table.tableName,
        ALLOWED_GROUPS: allowedGroups.join(','),
      },
      tracing: lambda.Tracing.ACTIVE,
    });

    // Grant permissions
    table.grantReadWriteData(lambdaFunction);

    // Additional permissions for approve/suspend operations
    if (
      functionName === 'approveOrganization' ||
      functionName === 'suspendOrganization'
    ) {
      lambdaFunction.addToRolePolicy(
        new iam.PolicyStatement({
          actions: [
            'ses:SendEmail',
            'ses:SendRawEmail',
            'cognito-idp:AdminCreateUser',
            'cognito-idp:AdminAddUserToGroup',
            'route53:ChangeResourceRecordSets',
            'lambda:InvokeFunction',
          ],
          resources: ['*'],
        })
      );
    }

    // Create AppSync data source
    const dataSource = this.api.addLambdaDataSource(`${id}DataSource`, lambdaFunction);

    // Create resolver
    dataSource.createResolver(`${id}Resolver`, {
      typeName: typeName,
      fieldName: functionName,
    });

    this.resolvers[functionName] = lambdaFunction;
  }
}

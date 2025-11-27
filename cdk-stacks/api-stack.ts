import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import * as path from 'path';

export interface ApiStackProps extends cdk.StackProps {
  userPool: cognito.UserPool;
  tables: { [key: string]: dynamodb.Table };
  dataBucket: s3.Bucket;
}

export class ApiStack extends cdk.Stack {
  public readonly api: apigateway.RestApi;
  public readonly authorizer: apigateway.CognitoUserPoolsAuthorizer;

  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    console.log('🚀 Creating API Gateway and Lambda functions...');

    // Create Lambda execution role
    const lambdaRole = new iam.Role(this, 'LambdaExecutionRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaVPCAccessExecutionRole'),
      ],
    });

    // Grant permissions to Lambda role
    props.tables.organizations.grantReadWriteData(lambdaRole);
    props.tables.users.grantReadWriteData(lambdaRole);
    props.tables.comments.grantReadWriteData(lambdaRole);
    props.dataBucket.grantReadWrite(lambdaRole);

    // Grant Cognito permissions
    lambdaRole.addToPolicy(new iam.PolicyStatement({
      actions: [
        'cognito-idp:AdminCreateUser',
        'cognito-idp:AdminDeleteUser',
        'cognito-idp:AdminUpdateUserAttributes',
        'cognito-idp:AdminGetUser',
        'cognito-idp:AdminListGroupsForUser',
        'cognito-idp:AdminAddUserToGroup',
        'cognito-idp:AdminRemoveUserFromGroup',
        'cognito-idp:ListUsers',
        'cognito-idp:AdminSetUserPassword',
        'cognito-idp:SignUp',                    // NEW: For user registration
        'cognito-idp:ConfirmSignUp',            // NEW: For email verification
      ],
      resources: [props.userPool.userPoolArn],
    }));

    // Grant QuickSight permissions
    lambdaRole.addToPolicy(new iam.PolicyStatement({
      actions: [
        'quicksight:GenerateEmbedUrlForRegisteredUser',
        'quicksight:GenerateEmbedUrlForAnonymousUser',
        'quicksight:GetDashboardEmbedUrl',
        'quicksight:DescribeDashboard',
        'quicksight:ListDashboards',
        'quicksight:DescribeUser',
        'quicksight:RegisterUser',
        'quicksight:GetAuthCode',
        'quicksight:UpdateDashboardPermissions',
        'quicksight:DescribeDashboardPermissions',
      ],
      resources: ['*'],
    }));

    // Environment variables for Lambda functions
    const lambdaEnvironment = {
      USER_POOL_ID: props.userPool.userPoolId,
      USER_POOL_CLIENT_ID: '1ranm65v7jnt1f3s9i7m6rug00',
      ORGANIZATIONS_TABLE: props.tables.organizations.tableName,
      USERS_TABLE: props.tables.users.tableName,
      COMMENTS_TABLE: props.tables.comments.tableName,
      DATA_BUCKET: props.dataBucket.bucketName,
      REGION: this.region,
    };

    // Lambda Functions
    const authFunction = new lambda.Function(this, 'AuthFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda-functions/auth')),
      environment: lambdaEnvironment,
      role: lambdaRole,
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
    });

    const organizationFunction = new lambda.Function(this, 'OrganizationFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda-functions/organization')),
      environment: lambdaEnvironment,
      role: lambdaRole,
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
    });

    const userManagementFunction = new lambda.Function(this, 'UserManagementFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda-functions/user-management')),
      environment: lambdaEnvironment,
      role: lambdaRole,
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
    });

    const dashboardFunction = new lambda.Function(this, 'DashboardFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda-functions/quicksight')),
      environment: {
        ...lambdaEnvironment,
        AWS_ACCOUNT_ID: this.account,
      },
      role: lambdaRole,
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
    });

    const commentsFunction = new lambda.Function(this, 'CommentsFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda-functions/comments')),
      environment: lambdaEnvironment,
      role: lambdaRole,
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
    });

    // API Gateway
    this.api = new apigateway.RestApi(this, 'HRAnalyticsApi', {
      restApiName: 'hr-analytics-api',
      description: 'API for HR Analytics SaaS Application',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: [
          'Content-Type',
          'X-Amz-Date',
          'Authorization',
          'X-Api-Key',
          'X-Amz-Security-Token',
        ],
        allowCredentials: true,
      },
      deployOptions: {
        stageName: 'prod',
        throttlingRateLimit: 100,
        throttlingBurstLimit: 200,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
      },
    });

    // Cognito Authorizer
    this.authorizer = new apigateway.CognitoUserPoolsAuthorizer(this, 'ApiAuthorizer', {
      cognitoUserPools: [props.userPool],
      identitySource: 'method.request.header.Authorization',
      authorizerName: 'CognitoAuthorizer',
    });

    // API Resources and Methods

    // Auth endpoints
    const auth = this.api.root.addResource('auth');
    const authSignup = auth.addResource('signup');
    authSignup.addMethod('POST', new apigateway.LambdaIntegration(authFunction));

    const authLogin = auth.addResource('login');
    authLogin.addMethod('POST', new apigateway.LambdaIntegration(authFunction));

    const authMe = auth.addResource('me');
    authMe.addMethod('GET', new apigateway.LambdaIntegration(authFunction), {
      authorizer: this.authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });

    // NEW ROUTES for user registration
    const authLookupOrg = auth.addResource('lookup-organization');
    authLookupOrg.addMethod('GET', new apigateway.LambdaIntegration(authFunction));

    const authRegisterUser = auth.addResource('register-user');
    authRegisterUser.addMethod('POST', new apigateway.LambdaIntegration(authFunction));

    const authVerifyEmail = auth.addResource('verify-email');
    authVerifyEmail.addMethod('POST', new apigateway.LambdaIntegration(authFunction));

    // Organization endpoints
    const organizations = this.api.root.addResource('organizations');
    organizations.addMethod('GET', new apigateway.LambdaIntegration(organizationFunction), {
      authorizer: this.authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });
    organizations.addMethod('POST', new apigateway.LambdaIntegration(organizationFunction), {
      authorizer: this.authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });

    const organization = organizations.addResource('{organizationId}');
    organization.addMethod('GET', new apigateway.LambdaIntegration(organizationFunction), {
      authorizer: this.authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });
    organization.addMethod('PUT', new apigateway.LambdaIntegration(organizationFunction), {
      authorizer: this.authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });
    organization.addMethod('DELETE', new apigateway.LambdaIntegration(organizationFunction), {
      authorizer: this.authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });

    const orgApprove = organization.addResource('approve');
    orgApprove.addMethod('POST', new apigateway.LambdaIntegration(organizationFunction), {
      authorizer: this.authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });

    // User management endpoints
    const users = this.api.root.addResource('users');
    users.addMethod('GET', new apigateway.LambdaIntegration(userManagementFunction), {
      authorizer: this.authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });
    users.addMethod('POST', new apigateway.LambdaIntegration(userManagementFunction), {
      authorizer: this.authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });

    const user = users.addResource('{userId}');
    user.addMethod('GET', new apigateway.LambdaIntegration(userManagementFunction), {
      authorizer: this.authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });
    user.addMethod('PUT', new apigateway.LambdaIntegration(userManagementFunction), {
      authorizer: this.authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });
    user.addMethod('DELETE', new apigateway.LambdaIntegration(userManagementFunction), {
      authorizer: this.authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });

    const userApprove = user.addResource('approve');
    userApprove.addMethod('POST', new apigateway.LambdaIntegration(userManagementFunction), {
      authorizer: this.authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });

    // Dashboard endpoints
    const dashboards = this.api.root.addResource('dashboards');
    
    const dashboardEmbedUrl = dashboards.addResource('embed-url');
    dashboardEmbedUrl.addMethod('GET', new apigateway.LambdaIntegration(dashboardFunction), {
      authorizer: this.authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
      requestParameters: {
        'method.request.querystring.dashboard': false,
      },
    });

    const dashboardList = dashboards.addResource('list');
    dashboardList.addMethod('GET', new apigateway.LambdaIntegration(dashboardFunction), {
      authorizer: this.authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });

    const dashboardEmbed = dashboards.addResource('embed');
    dashboardEmbed.addMethod('POST', new apigateway.LambdaIntegration(dashboardFunction), {
      authorizer: this.authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });

    // Comments endpoints
    const comments = this.api.root.addResource('comments');
    comments.addMethod('GET', new apigateway.LambdaIntegration(commentsFunction), {
      authorizer: this.authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });
    comments.addMethod('POST', new apigateway.LambdaIntegration(commentsFunction), {
      authorizer: this.authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });

    const comment = comments.addResource('{commentId}');
    comment.addMethod('GET', new apigateway.LambdaIntegration(commentsFunction), {
      authorizer: this.authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });
    comment.addMethod('PUT', new apigateway.LambdaIntegration(commentsFunction), {
      authorizer: this.authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });
    comment.addMethod('DELETE', new apigateway.LambdaIntegration(commentsFunction), {
      authorizer: this.authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });

    const commentApprove = comment.addResource('approve');
    commentApprove.addMethod('POST', new apigateway.LambdaIntegration(commentsFunction), {
      authorizer: this.authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });

    const commentDisapprove = comment.addResource('disapprove');
    commentDisapprove.addMethod('POST', new apigateway.LambdaIntegration(commentsFunction), {
      authorizer: this.authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });

    // Outputs
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: this.api.url,
      description: 'API Gateway URL',
      exportName: 'HRAnalytics-ApiUrl',
    });

    new cdk.CfnOutput(this, 'DashboardFunctionName', {
      value: dashboardFunction.functionName,
      description: 'QuickSight Dashboard Lambda Function Name',
    });

    console.log('✅ API Gateway and Lambda functions created successfully');
  }
}
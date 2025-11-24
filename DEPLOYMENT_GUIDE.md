# HR Analytics SaaS Application - Complete Deployment Guide

## Overview

This is a complete AWS-powered HR Analytics SaaS application with role-based authentication, QuickSight dashboard integration, and multi-tenant architecture.

## Architecture Components

### Backend Infrastructure (AWS CDK)
1. **Auth Stack** - Cognito User Pool with role-based groups
2. **Network Stack** - VPC with public/private subnets
3. **Storage Stack** - DynamoDB tables and S3 buckets
4. **API Stack** - API Gateway + Lambda functions

### Frontend (React + AWS Amplify)
- Role-based authentication and routing
- QuickSight dashboard embedding
- User and organization management
- Comment system with approval workflow

## Prerequisites

- AWS Account with appropriate permissions
- Node.js 18+ and npm
- AWS CLI configured
- AWS CDK CLI installed (`npm install -g aws-cdk`)
- Git

## Deployment Steps

### Step 1: Deploy Backend Infrastructure

1. **Navigate to the CDK directory:**
   ```bash
   cd hr-analytics-saas/cdk-stacks
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create the main CDK app file (`bin/app.ts`):**
   ```typescript
   #!/usr/bin/env node
   import * as cdk from 'aws-cdk-lib';
   import { AuthStack } from '../lib/auth-stack';
   import { NetworkStack } from '../lib/network-stack';
   import { StorageStack } from '../lib/storage-stack';
   import { ApiStack } from '../lib/api-stack';

   const app = new cdk.App();

   const env = {
     account: process.env.CDK_DEFAULT_ACCOUNT,
     region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
   };

   // Deploy stacks
   const authStack = new AuthStack(app, 'HRAnalyticsAuthStack', { env });
   const networkStack = new NetworkStack(app, 'HRAnalyticsNetworkStack', { env });
   const storageStack = new StorageStack(app, 'HRAnalyticsStorageStack', {
     env,
     vpc: networkStack.vpc,
   });
   const apiStack = new ApiStack(app, 'HRAnalyticsApiStack', {
     env,
     userPool: authStack.userPool,
     tables: storageStack.tables,
     dataBucket: storageStack.dataBucket,
   });

   app.synth();
   ```

4. **Bootstrap CDK (first time only):**
   ```bash
   cdk bootstrap
   ```

5. **Deploy all stacks:**
   ```bash
   cdk deploy --all
   ```

6. **Save the outputs:**
   After deployment, note down these values:
   - User Pool ID
   - User Pool Client ID
   - API Gateway URL
   - VPC ID
   - DynamoDB table names
   - S3 bucket name

### Step 2: Set Up Lambda Functions

1. **Install dependencies for each Lambda function:**
   ```bash
   cd lambda-functions/auth && npm install && cd ../..
   cd lambda-functions/organization && npm install && cd ../..
   cd lambda-functions/user-management && npm install && cd ../..
   cd lambda-functions/dashboard && npm install && cd ../..
   cd lambda-functions/comments && npm install && cd ../..
   ```

2. **Create package.json for each Lambda:**
   ```json
   {
     "name": "lambda-function",
     "version": "1.0.0",
     "main": "index.js",
     "dependencies": {
       "@aws-sdk/client-cognito-identity-provider": "^3.400.0",
       "@aws-sdk/client-dynamodb": "^3.400.0",
       "@aws-sdk/lib-dynamodb": "^3.400.0",
       "@aws-sdk/client-quicksight": "^3.400.0"
     }
   }
   ```

### Step 3: Configure QuickSight

1. **Set up QuickSight in your AWS account:**
   - Go to AWS QuickSight console
   - Choose Standard or Enterprise edition
   - Set up your first user

2. **Create or import your dashboards:**
   - Controlio Dashboard
   - HR Productivity Dashboard

3. **Grant Lambda execution role access to QuickSight:**
   - In IAM, find the Lambda execution role created by CDK
   - Attach QuickSight permissions policy

4. **Register users in QuickSight:**
   Users need to be registered in QuickSight to access embedded dashboards.
   You can do this via AWS Console or programmatically.

### Step 4: Deploy Frontend Application

1. **Navigate to frontend directory:**
   ```bash
   cd frontend-app
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Update AWS configuration:**
   Edit `src/aws-config.js` with your values from CDK outputs:
   ```javascript
   export const awsConfig = {
     Auth: {
       Cognito: {
         userPoolId: 'YOUR_USER_POOL_ID',
         userPoolClientId: 'YOUR_USER_POOL_CLIENT_ID',
         // ... other config
       },
     },
     API: {
       REST: {
         'HRAnalyticsAPI': {
           endpoint: 'YOUR_API_GATEWAY_URL',
           region: 'us-east-1',
         },
       },
     },
   };

   export const APP_CONFIG = {
     apiUrl: 'YOUR_API_GATEWAY_URL',
     region: 'us-east-1',
     quicksightDashboards: {
       controlio: 'YOUR_CONTROLIO_DASHBOARD_ID',
       hrProductivity: 'YOUR_HR_PRODUCTIVITY_DASHBOARD_ID',
     },
   };
   ```

4. **Create public/index.html:**
   ```html
   <!DOCTYPE html>
   <html lang="en">
     <head>
       <meta charset="utf-8" />
       <meta name="viewport" content="width=device-width, initial-scale=1" />
       <meta name="theme-color" content="#000000" />
       <meta name="description" content="HR Analytics SaaS Platform" />
       <title>HR Analytics</title>
     </head>
     <body>
       <noscript>You need to enable JavaScript to run this app.</noscript>
       <div id="root"></div>
     </body>
   </html>
   ```

5. **Test locally:**
   ```bash
   npm start
   ```

6. **Build for production:**
   ```bash
   npm run build
   ```

### Step 5: Deploy to AWS Amplify

1. **Create Amplify app:**
   ```bash
   aws amplify create-app --name hr-analytics-saas --region us-east-1
   ```

2. **Or use AWS Console:**
   - Go to AWS Amplify console
   - Click "New app" > "Host web app"
   - Choose "Deploy without Git provider"
   - Upload your `build` folder

3. **Configure custom domain (optional):**
   - In Amplify console, go to "Domain management"
   - Add your custom domain
   - Follow DNS configuration steps

### Step 6: Initial Setup

1. **Create Super Admin user:**
   Use AWS Console or AWS CLI to create your first super admin:
   ```bash
   aws cognito-idp admin-create-user \
     --user-pool-id YOUR_USER_POOL_ID \
     --username admin@yourdomain.com \
     --user-attributes Name=email,Value=admin@yourdomain.com Name=name,Value="Super Admin" \
     --message-action SUPPRESS
   
   aws cognito-idp admin-set-user-password \
     --user-pool-id YOUR_USER_POOL_ID \
     --username admin@yourdomain.com \
     --password "YourSecurePassword123!" \
     --permanent
   
   aws cognito-idp admin-add-user-to-group \
     --user-pool-id YOUR_USER_POOL_ID \
     --username admin@yourdomain.com \
     --group-name SuperAdmins
   ```

2. **Set custom attributes for super admin:**
   ```bash
   aws cognito-idp admin-update-user-attributes \
     --user-pool-id YOUR_USER_POOL_ID \
     --username admin@yourdomain.com \
     --user-attributes \
       Name=custom:organizationId,Value=system \
       Name=custom:role,Value=super_admin \
       Name=custom:approvalStatus,Value=approved
   ```

## User Roles and Permissions

### SuperAdmins
- Manage all organizations
- Approve/reject organization requests
- Full system access

### OrgAdmins (Organization Administrators)
- Manage users within their organization
- Approve/reject user signups
- View all metrics in their organization
- Delete comments

### HRManagers
- View all metrics in their organization
- Approve/disapprove comments
- Delete comments

### Supervisors
- View all metrics in their organization
- Comment on all metrics
- Approve/disapprove comments

### Employees
- View only their own metrics
- Comment on their own metrics

## Application Features

### 1. Role-Based Authentication
- Secure login with AWS Cognito
- Password requirements enforced
- Account approval workflow

### 2. Organization Management (SuperAdmins only)
- Approve new organization requests
- View all organizations
- Manage organization status

### 3. User Management
- Create users within organization
- Approve user signups
- Assign roles and permissions
- Delete users

### 4. Dashboard Access
- Embedded QuickSight dashboards
- Role-based metric visibility
- Real-time analytics

### 5. Comment System
- Comment on metrics
- Approval workflow for comments
- Role-based comment permissions

## Security Best Practices

1. **API Gateway:**
   - All endpoints (except login/signup) require authentication
   - Cognito authorizer validates JWT tokens

2. **Lambda Functions:**
   - Principle of least privilege for IAM roles
   - Input validation on all endpoints
   - Secure handling of user data

3. **Frontend:**
   - No sensitive data in localStorage
   - JWT tokens managed by AWS Amplify
   - HTTPS only (enforced by Amplify)

4. **DynamoDB:**
   - Encryption at rest enabled
   - Point-in-time recovery enabled
   - Fine-grained access control

## Troubleshooting

### Issue: "QuickSight user not found"
**Solution:** Users must be registered in QuickSight before accessing dashboards. Register users via QuickSight console or API.

### Issue: "Account pending approval"
**Solution:** Organization admins must approve user signups. SuperAdmins must approve organization requests.

### Issue: API Gateway 403 errors
**Solution:** Check that Cognito authorizer is properly configured and JWT token is valid.

### Issue: Lambda timeout errors
**Solution:** Increase Lambda timeout in CDK stack (currently 30 seconds).

## Monitoring and Maintenance

1. **CloudWatch Logs:**
   - Lambda function logs
   - API Gateway access logs

2. **DynamoDB:**
   - Monitor read/write capacity
   - Check for throttling

3. **Cognito:**
   - Monitor user pool metrics
   - Track failed login attempts

4. **Costs:**
   - Use AWS Cost Explorer
   - Set up billing alerts
   - Monitor Lambda invocations

## Customization

### Adding New Dashboards
1. Create dashboard in QuickSight
2. Update `APP_CONFIG.quicksightDashboards` in `aws-config.js`
3. Update dashboard list in Lambda function

### Adding New User Roles
1. Create group in Cognito (via CDK or console)
2. Update role mappings in Lambda functions
3. Update permissions in `AuthContext.js`
4. Update UI components for new role

### Changing Organization Structure
1. Modify DynamoDB schema in Storage Stack
2. Update Lambda functions to handle new structure
3. Update frontend to display new fields

## Backup and Recovery

1. **DynamoDB:**
   - Point-in-time recovery enabled
   - Regular snapshots via AWS Backup

2. **S3:**
   - Versioning enabled
   - Lifecycle policies for cost optimization

3. **Cognito:**
   - Export users regularly
   - Backup user pool configuration

## Next Steps

1. Set up CI/CD pipeline with GitHub Actions or AWS CodePipeline
2. Configure custom domain and SSL certificate
3. Set up monitoring and alerting
4. Implement data analytics and reporting
5. Add email notifications for approvals
6. Implement audit logging

## Support and Documentation

- AWS CDK Documentation: https://docs.aws.amazon.com/cdk/
- AWS Amplify Documentation: https://docs.amplify.aws/
- AWS Cognito Documentation: https://docs.aws.amazon.com/cognito/
- QuickSight Embedding SDK: https://github.com/awslabs/amazon-quicksight-embedding-sdk

## License

This application is proprietary. All rights reserved.

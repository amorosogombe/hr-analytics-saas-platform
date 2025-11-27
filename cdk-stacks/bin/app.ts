#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { AuthStack } from '../auth-stack';
import { NetworkStack } from '../network-stack';
import { StorageStack } from '../storage-stack';
import { ApiStack } from '../api-stack';

const app = new cdk.App();

// Use environment variables or default to us-east-1
const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
};

console.log('🚀 Deploying HR Analytics SaaS Infrastructure...');
console.log(`📍 Region: ${env.region}`);
console.log(`🔑 Account: ${env.account}`);

// Deploy Auth Stack (Cognito)
const authStack = new AuthStack(app, 'HRAnalyticsAuthStack', { 
  env,
  description: 'Authentication and user management with Cognito',
});

// Deploy Network Stack (VPC)
const networkStack = new NetworkStack(app, 'HRAnalyticsNetworkStack', { 
  env,
  description: 'VPC and networking infrastructure',
});

// Deploy Storage Stack (DynamoDB + S3)
const storageStack = new StorageStack(app, 'HRAnalyticsStorageStack', {
  env,
  vpc: networkStack.vpc,
  description: 'Data storage with DynamoDB and S3',
});

// Deploy API Stack (API Gateway + Lambda)
const apiStack = new ApiStack(app, 'HRAnalyticsApiStack', {
  env,
  userPool: authStack.userPool,
  tables: storageStack.tables,
  dataBucket: storageStack.dataBucket,
  description: 'REST API with Lambda functions',
});

// Add dependencies to ensure correct deployment order
storageStack.addDependency(networkStack);
apiStack.addDependency(authStack);
apiStack.addDependency(storageStack);

console.log('✅ CDK app configuration complete');

app.synth();

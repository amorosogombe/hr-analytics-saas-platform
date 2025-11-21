#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { NetworkStack } from '../lib/network-stack';
import { AuthStack } from '../lib/auth-stack';
import { StorageStack } from '../lib/storage-stack';

const app = new cdk.App();

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT || process.env.AWS_ACCOUNT_ID,
  region: 'eu-west-1', // Fixed to eu-west-1
};

const stackProps: cdk.StackProps = {
  env,
  description: 'HR Analytics SaaS Platform',
  tags: {
    Project: 'HRAnalytics',
    Environment: process.env.ENVIRONMENT || 'production',
    ManagedBy: 'CDK',
    Region: 'eu-west-1',
  },
};

console.log('🚀 Initializing HR Analytics Platform stacks...');
console.log('📍 Region: eu-west-1');
console.log('🏗️  Account:', env.account);

const networkStack = new NetworkStack(app, 'HRAnalytics-Network', stackProps);
console.log('✅ Network stack defined');

const authStack = new AuthStack(app, 'HRAnalytics-Auth', stackProps);
console.log('✅ Auth stack defined');

const storageStack = new StorageStack(app, 'HRAnalytics-Storage', {
  ...stackProps,
  vpc: networkStack.vpc,
});
console.log('✅ Storage stack defined');

console.log('📦 App synthesis complete');

app.synth();

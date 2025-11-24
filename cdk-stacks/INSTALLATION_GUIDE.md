# CDK Setup - Step-by-Step Instructions

## 📥 Download Required Files

Download these configuration files and place them in your `cdk-stacks` folder:

1. **package.json** - NPM configuration
2. **cdk.json** - CDK configuration  
3. **tsconfig.json** - TypeScript configuration
4. **bin/app.ts** - Main CDK app (create bin folder first)
5. **.gitignore** - Git ignore rules

## 🗂️ Your Folder Structure Should Look Like This:

```
C:\Users\Amoroso\Documents\A1 Strategy\...\hr-analytics-saas\
├── cdk-stacks\
│   ├── bin\
│   │   └── app.ts          ← CREATE THIS FOLDER AND FILE
│   ├── api-stack.ts        ← Already exists
│   ├── auth-stack.ts       ← Already exists (from your upload)
│   ├── network-stack.ts    ← Already exists (from your upload)
│   ├── storage-stack.ts    ← Already exists (from your upload)
│   ├── package.json        ← DOWNLOAD AND PLACE HERE
│   ├── cdk.json            ← DOWNLOAD AND PLACE HERE
│   ├── tsconfig.json       ← DOWNLOAD AND PLACE HERE
│   └── .gitignore          ← DOWNLOAD AND PLACE HERE
├── lambda-functions\
├── frontend-app\
└── README.md
```

## 📋 Installation Steps (Git Bash)

### Step 1: Navigate to cdk-stacks folder

```bash
cd "C:/Users/Amoroso/Documents/A1 Strategy/A1 Strategy - Productivity Analytics Code/hr-analytics-saas/cdk-stacks"
```

### Step 2: Create bin directory

```bash
mkdir bin
```

### Step 3: Copy downloaded files

Download all files from the link I'll provide, then:

```bash
# After downloading, copy files to the right locations:
# - Copy package.json, cdk.json, tsconfig.json, .gitignore to cdk-stacks/
# - Copy app.ts to cdk-stacks/bin/
```

### Step 4: Install dependencies

```bash
npm install
```

This will install:
- aws-cdk (CDK toolkit)
- aws-cdk-lib (CDK library)
- TypeScript
- Required types

**This may take 2-3 minutes.**

### Step 5: Verify installation

```bash
# Check if TypeScript compiles
npx tsc

# You should see no errors
```

### Step 6: Configure AWS credentials

Make sure your AWS credentials are configured:

```bash
# Check if AWS CLI is configured
aws sts get-caller-identity
```

If not configured:
```bash
aws configure
```

You'll need:
- AWS Access Key ID
- AWS Secret Access Key
- Region: us-east-1 (or your preferred region)
- Output format: json

### Step 7: Bootstrap CDK (one-time setup)

```bash
npx cdk bootstrap aws://YOUR_ACCOUNT_ID/us-east-1
```

Replace `YOUR_ACCOUNT_ID` with your AWS account ID (you'll see it from the `get-caller-identity` command).

**Or simply:**
```bash
npx cdk bootstrap
```

This creates an S3 bucket and IAM roles needed for CDK deployments.

### Step 8: Preview what will be deployed

```bash
npx cdk diff
```

This shows you what resources will be created without actually deploying them.

### Step 9: Deploy all stacks

```bash
npx cdk deploy --all
```

**Important:** 
- You'll be asked to approve security changes → Type **y** and press Enter
- Deployment takes **15-20 minutes**
- Watch for any errors

### Step 10: Save the outputs

After deployment completes, you'll see output like:

```
Outputs:
HRAnalyticsAuthStack.UserPoolId = us-east-1_XXXXXXXXX
HRAnalyticsAuthStack.UserPoolClientId = 7a8b9c0d1e2f3g4h5i6j7k8l9m0n1o2p
HRAnalyticsApiStack.ApiUrl = https://abc123xyz.execute-api.us-east-1.amazonaws.com/prod/
```

**SAVE THESE VALUES!** You'll need them for frontend configuration.

## ✅ Success Indicators

If everything works, you should see:

```
✅ HRAnalyticsAuthStack
✅ HRAnalyticsNetworkStack  
✅ HRAnalyticsStorageStack
✅ HRAnalyticsApiStack

Stack ARN:
arn:aws:cloudformation:us-east-1:123456789012:stack/HRAnalyticsAuthStack/...
```

## 🚨 Common Errors and Fixes

### Error: "Cannot find module 'aws-cdk-lib'"
**Fix:** Run `npm install` in the cdk-stacks folder

### Error: "Specify an environment name"
**Fix:** Make sure `cdk.json` exists in your cdk-stacks folder

### Error: "--app is required"
**Fix:** Make sure `cdk.json` exists and contains the correct app path

### Error: "Unable to resolve AWS account to use"
**Fix:** Run `aws configure` to set up your AWS credentials

### Error: "This stack uses assets, so the toolkit stack must be deployed"
**Fix:** Run `npx cdk bootstrap`

### Error: TypeScript compilation errors
**Fix:** Make sure all .ts files are in the correct location

## 📝 What Gets Deployed

When you run `cdk deploy --all`, CDK will create:

### HRAnalyticsAuthStack:
- Cognito User Pool (for authentication)
- Cognito User Pool Client
- 5 User Groups (SuperAdmins, OrgAdmins, HRManagers, Supervisors, Employees)

### HRAnalyticsNetworkStack:
- VPC with public and private subnets
- NAT Gateway
- Internet Gateway
- Route tables
- VPC endpoints for S3 and DynamoDB

### HRAnalyticsStorageStack:
- DynamoDB tables:
  - Organizations table
  - Users table
  - Comments table
- S3 bucket for data lake

### HRAnalyticsApiStack:
- API Gateway REST API
- 5 Lambda functions:
  - Auth function (login/signup)
  - Organization function (org management)
  - User management function
  - Dashboard function (QuickSight)
  - Comments function
- IAM roles and policies
- CloudWatch log groups

## 💰 Estimated Monthly Cost

- **DynamoDB:** ~$1-5 (on-demand, pay per request)
- **Lambda:** ~$1-10 (pay per invocation, 1M free tier)
- **API Gateway:** ~$1-5 (pay per request, 1M free tier)
- **NAT Gateway:** ~$32 (flat rate)
- **S3:** ~$1-5 (pay per GB stored)
- **Cognito:** Free up to 50,000 MAU

**Total: ~$35-60/month** (mostly NAT Gateway)

## 🔄 Updating the Infrastructure

To make changes later:

1. Edit the TypeScript files
2. Run `npx cdk diff` to see changes
3. Run `npx cdk deploy --all` to apply changes

## 🗑️ Destroying Everything (if needed)

To delete all resources:

```bash
npx cdk destroy --all
```

**Warning:** This will delete all data! Backup first.

## 📞 Next Steps

After successful deployment:

1. ✅ Save all output values (User Pool ID, Client ID, API URL)
2. ⏭️ Set up Lambda function dependencies
3. ⏭️ Configure frontend with CDK outputs
4. ⏭️ Deploy frontend to AWS Amplify
5. ⏭️ Create first SuperAdmin user
6. ⏭️ Test the application

## 🎯 Quick Reference Commands

```bash
# Navigate to CDK folder
cd "C:/Users/Amoroso/Documents/A1 Strategy/A1 Strategy - Productivity Analytics Code/hr-analytics-saas/cdk-stacks"

# Install dependencies
npm install

# Preview changes
npx cdk diff

# Deploy everything
npx cdk deploy --all

# Deploy single stack
npx cdk deploy HRAnalyticsAuthStack

# Destroy everything
npx cdk destroy --all
```

Good luck! 🚀

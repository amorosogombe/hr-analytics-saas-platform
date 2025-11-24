# Missing Stack Files - Quick Fix

## The Problem

You're getting this error:
```
error TS2307: Cannot find module '../auth-stack'
error TS2307: Cannot find module '../network-stack'
error TS2307: Cannot find module '../storage-stack'
```

**Reason:** The three stack files are missing from your `cdk-stacks` folder!

---

## The Solution

Copy these 3 files to your `cdk-stacks` folder.

---

## 📂 Files Included

1. **auth-stack.ts** - Cognito authentication stack
2. **network-stack.ts** - VPC and networking stack
3. **storage-stack.ts** - DynamoDB and S3 storage stack

---

## 📋 Installation Steps

### Step 1: Extract this ZIP file

You'll see 3 TypeScript files:
- `auth-stack.ts`
- `network-stack.ts`
- `storage-stack.ts`

### Step 2: Copy ALL 3 files to your cdk-stacks folder

**Target location:**
```
C:\Users\Amoroso\Documents\A1 Strategy\A1 Strategy - Productivity Analytics Code\hr-analytics-saas\cdk-stacks\
```

Copy the 3 `.ts` files directly into the `cdk-stacks` folder (not in any subfolder).

### Step 3: Verify your folder structure

Your `cdk-stacks` folder should now look like this:

```
cdk-stacks/
├── bin/
│   └── app.ts
├── auth-stack.ts       ← NEW (you just copied)
├── network-stack.ts    ← NEW (you just copied)
├── storage-stack.ts    ← NEW (you just copied)
├── api-stack.ts        ← Already exists
├── package.json
├── cdk.json
├── tsconfig.json
└── .gitignore
```

### Step 4: Try deploying again

Open Git Bash and run:

```bash
# Navigate to cdk-stacks
cd "C:/Users/Amoroso/Documents/A1 Strategy/A1 Strategy - Productivity Analytics Code/hr-analytics-saas/cdk-stacks"

# Bootstrap (if you haven't already)
npx cdk bootstrap

# Deploy all stacks
npx cdk deploy --all
```

---

## ✅ Success Indicators

After running `npx cdk deploy --all`, you should see:

```
This deployment will make potentially sensitive changes according to your current security approval level.
Do you wish to proceed? (y/n) 
```

Type **y** and press Enter.

Then you should see stacks deploying:
```
HRAnalyticsAuthStack: building assets...
HRAnalyticsAuthStack: deploying...
✅ HRAnalyticsAuthStack

HRAnalyticsNetworkStack: building assets...
HRAnalyticsNetworkStack: deploying...
✅ HRAnalyticsNetworkStack

HRAnalyticsStorageStack: building assets...
HRAnalyticsStorageStack: deploying...
✅ HRAnalyticsStorageStack

HRAnalyticsApiStack: building assets...
HRAnalyticsApiStack: deploying...
✅ HRAnalyticsApiStack
```

**This will take 15-20 minutes!** Don't close your terminal.

---

## 🎯 Important: Save These Outputs!

After deployment completes, you'll see outputs like:

```
Outputs:
HRAnalyticsAuthStack.UserPoolId = us-east-1_XXXXXXXXX
HRAnalyticsAuthStack.UserPoolClientId = 7a8b9c0d1e2f3g4h5i6j7k8l9m
HRAnalyticsApiStack.ApiUrl = https://abc123xyz.execute-api.us-east-1.amazonaws.com/prod/
HRAnalyticsStorageStack.DataBucketName = hr-analytics-data-123456789012
HRAnalyticsStorageStack.OrganizationsTableName = hr-analytics-organizations
HRAnalyticsNetworkStack.VpcId = vpc-0a1b2c3d4e5f6g7h8
```

**Copy and save all these values!** You'll need them for:
1. Frontend configuration
2. Creating your first SuperAdmin user
3. Future reference

---

## 🚨 If You Still Get Errors

### Error: "Cannot find module"
**Fix:** Make sure all 3 .ts files are in the `cdk-stacks` folder (not in a subfolder)

### Error: "Unable to resolve AWS account"
**Fix:** Run `aws configure` and enter your AWS credentials

### Error: Permission denied / Access denied
**Fix:** Check your AWS IAM permissions - you need Administrator access for first deployment

---

## 📞 What's Next?

After successful deployment:

1. ✅ Save all CDK outputs
2. ⏭️ Install Lambda function dependencies
3. ⏭️ Configure frontend with CDK outputs
4. ⏭️ Deploy frontend to AWS Amplify
5. ⏭️ Create first SuperAdmin user
6. ⏭️ Test the application

---

## 💰 Cost Estimate

This deployment will create:
- Cognito User Pool (Free tier: 50K MAU)
- VPC with NAT Gateway (~$32/month)
- DynamoDB tables (Pay per request, ~$1-5/month)
- S3 bucket (Pay per GB, ~$1-5/month)
- Lambda functions (Free tier: 1M requests/month)
- API Gateway (Free tier: 1M requests/month)

**Estimated total: ~$35-60/month** (mostly the NAT Gateway)

---

## 🎯 Quick Commands Reference

```bash
# Navigate to folder
cd "C:/Users/Amoroso/Documents/A1 Strategy/A1 Strategy - Productivity Analytics Code/hr-analytics-saas/cdk-stacks"

# Bootstrap (first time only)
npx cdk bootstrap

# Preview changes
npx cdk diff

# Deploy everything
npx cdk deploy --all

# Deploy single stack
npx cdk deploy HRAnalyticsAuthStack

# Destroy everything (BE CAREFUL!)
npx cdk destroy --all
```

Good luck! 🚀

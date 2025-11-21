#!/bin/bash

echo "🏥 HR Analytics Infrastructure Health Check"
echo "==========================================="
echo ""

# Load environment
if [ -f ../.env ]; then
  export $(cat ../.env | grep -v '^#' | xargs)
fi

checks_passed=0
checks_failed=0

check() {
  if eval "$2" > /dev/null 2>&1; then
    echo "✅ $1"
    ((checks_passed++))
  else
    echo "❌ $1"
    ((checks_failed++))
  fi
}

echo "Infrastructure Checks:"
check "VPC exists" "aws ec2 describe-vpcs --filters 'Name=tag:Name,Values=hr-analytics-vpc' --query 'Vpcs[0].VpcId' --output text"
check "User Pool exists" "aws cognito-idp describe-user-pool --user-pool-id \$USER_POOL_ID --query 'UserPool.Name' --output text"
check "Organizations table exists" "aws dynamodb describe-table --table-name hr-analytics-organizations --query 'Table.TableName' --output text"
check "Users table exists" "aws dynamodb describe-table --table-name hr-analytics-users --query 'Table.TableName' --output text"
check "Comments table exists" "aws dynamodb describe-table --table-name hr-analytics-comments --query 'Table.TableName' --output text"
check "S3 bucket exists" "aws s3 ls s3://\$DATA_BUCKET"
check "Super admin user exists" "aws cognito-idp admin-get-user --user-pool-id \$USER_POOL_ID --username agombe@a1strategy.com --query 'Username' --output text"
check "Starter org data exists" "aws dynamodb get-item --table-name hr-analytics-organizations --key '{\"organizationId\":{\"S\":\"a1strategy\"}}' --query 'Item.organizationId.S' --output text"

echo ""
echo "==========================================="
echo "Checks Passed: $checks_passed"
echo "Checks Failed: $checks_failed"

if [ $checks_failed -eq 0 ]; then
  echo "🎉 All systems healthy."
else
  echo "⚠️  Some checks failed. Please review."
fi

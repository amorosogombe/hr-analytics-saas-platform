# HR Analytics SaaS Application

A complete, production-ready AWS-powered SaaS application for HR productivity analytics with role-based access control, QuickSight dashboard integration, and multi-tenant architecture.

## Features

✅ **Role-Based Authentication** - Secure login with 5-tier user hierarchy
✅ **Multi-Tenant Architecture** - Separate organizations with isolated data
✅ **QuickSight Integration** - Embedded analytics dashboards
✅ **User Management** - Complete user lifecycle management
✅ **Organization Management** - Admin panel for organization approval
✅ **Comment System** - Collaborative commenting with approval workflow
✅ **Responsive Design** - Beautiful UI that works on all devices
✅ **AWS Best Practices** - Serverless, scalable, and cost-effective

## Technology Stack

### Backend
- **AWS CDK** - Infrastructure as Code
- **Amazon Cognito** - User authentication and authorization
- **AWS Lambda** - Serverless compute
- **Amazon API Gateway** - RESTful API
- **Amazon DynamoDB** - NoSQL database
- **Amazon S3** - Object storage
- **Amazon VPC** - Network isolation

### Frontend
- **React 18** - Modern UI framework
- **AWS Amplify** - Frontend hosting and deployment
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **QuickSight Embedding SDK** - Dashboard integration

## Quick Start

### Prerequisites
- AWS Account
- Node.js 18+
- AWS CLI configured
- AWS CDK CLI (`npm install -g aws-cdk`)

### Installation

1. **Clone or extract the project:**
   ```bash
   cd hr-analytics-saas
   ```

2. **Deploy backend infrastructure:**
   ```bash
   cd cdk-stacks
   npm install
   cdk bootstrap  # First time only
   cdk deploy --all
   ```

3. **Deploy frontend:**
   ```bash
   cd frontend-app
   npm install
   # Update src/aws-config.js with CDK outputs
   npm start  # Development
   npm run build  # Production
   ```

4. **Deploy to Amplify:**
   - Upload build folder to AWS Amplify console
   - Or connect to Git repository

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed instructions.

## User Roles

| Role | Permissions |
|------|-------------|
| **SuperAdmin** | System-wide access, manage organizations, all permissions |
| **OrgAdmin** | Organization management, user approval, all metrics access |
| **HRManager** | View all metrics, manage comments, approve comments |
| **Supervisor** | View all metrics, comment on all metrics, approve comments |
| **Employee** | View own metrics only, comment on own metrics |

## Project Structure

```
hr-analytics-saas/
├── cdk-stacks/                 # AWS CDK infrastructure
│   ├── api-stack.ts           # API Gateway + Lambda
│   ├── auth-stack.ts          # Cognito User Pool
│   ├── network-stack.ts       # VPC and networking
│   └── storage-stack.ts       # DynamoDB + S3
├── lambda-functions/          # Backend Lambda functions
│   ├── auth/                  # Authentication handlers
│   ├── organization/          # Organization management
│   ├── user-management/       # User CRUD operations
│   ├── dashboard/             # QuickSight integration
│   └── comments/              # Comment system
├── frontend-app/              # React frontend
│   ├── src/
│   │   ├── components/        # Reusable components
│   │   ├── contexts/          # React contexts (Auth)
│   │   ├── pages/             # Page components
│   │   ├── App.js            # Main app component
│   │   └── aws-config.js     # AWS configuration
│   └── package.json
└── DEPLOYMENT_GUIDE.md       # Detailed deployment guide
```

## Key Features Explained

### 1. Role-Based Access Control (RBAC)
- Implemented at multiple levels: Cognito groups, Lambda authorization, and React routing
- Enforced both on backend (Lambda) and frontend (React)
- Granular permissions for viewing, commenting, and approving

### 2. Organization Management
- Self-service organization registration
- SuperAdmin approval workflow
- Isolated data per organization
- Subdomain support (configurable)

### 3. User Management
- OrgAdmin can create and approve users
- Automatic role assignment to Cognito groups
- Custom user attributes in Cognito
- User approval workflow

### 4. Dashboard Integration
- Embedded QuickSight dashboards
- Role-based dashboard access
- Automatic embed URL generation
- Secure token-based authentication

### 5. Comment System
- Comment on dashboard metrics
- Approval workflow (Supervisor+)
- Role-based permissions (view, comment, approve, delete)
- DynamoDB single-table design for efficiency

## Configuration

### Environment Variables (Lambda)
Set via CDK in API Stack:
- `USER_POOL_ID` - Cognito User Pool ID
- `ORGANIZATIONS_TABLE` - DynamoDB organizations table
- `USERS_TABLE` - DynamoDB users table
- `COMMENTS_TABLE` - DynamoDB comments table
- `DATA_BUCKET` - S3 bucket name
- `REGION` - AWS region

### Frontend Configuration
Edit `frontend-app/src/aws-config.js`:
```javascript
export const awsConfig = {
  Auth: {
    Cognito: {
      userPoolId: 'YOUR_USER_POOL_ID',
      userPoolClientId: 'YOUR_CLIENT_ID',
      // ...
    },
  },
  API: {
    REST: {
      'HRAnalyticsAPI': {
        endpoint: 'YOUR_API_URL',
        region: 'us-east-1',
      },
    },
  },
};
```

## Security

- ✅ All API endpoints secured with Cognito authorizer
- ✅ JWT token validation on every request
- ✅ HTTPS only (enforced by Amplify/CloudFront)
- ✅ DynamoDB encryption at rest
- ✅ S3 bucket encryption
- ✅ VPC isolation for Lambda functions
- ✅ Least privilege IAM roles
- ✅ Input validation on all endpoints
- ✅ Password policy enforcement (12+ chars, complexity)

## Monitoring

### CloudWatch
- Lambda function logs
- API Gateway access logs
- Error tracking and alarms

### X-Ray (Optional)
Enable distributed tracing for Lambdas

### Cost Monitoring
- Set up AWS Budgets
- Monitor DynamoDB and Lambda usage
- Use Cost Explorer for analysis

## Development Workflow

1. **Make changes to infrastructure:**
   - Update CDK stacks
   - Run `cdk diff` to preview changes
   - Run `cdk deploy` to apply

2. **Make changes to Lambda functions:**
   - Edit Lambda code
   - Deploy changes: `cdk deploy ApiStack`
   - Test using API Gateway or Postman

3. **Make changes to frontend:**
   - Edit React components
   - Test locally: `npm start`
   - Build and deploy: `npm run build` then upload to Amplify

## Testing

### Backend
```bash
# Test Lambda functions locally
cd lambda-functions/auth
node -e "require('./index').handler(testEvent, {}, console.log)"
```

### Frontend
```bash
cd frontend-app
npm test
```

### Integration Testing
Use Postman or curl to test API endpoints:
```bash
curl -X POST https://your-api-url/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```

## Common Issues

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for troubleshooting section.

## Future Enhancements

- [ ] Email notifications for approvals
- [ ] Advanced analytics and reporting
- [ ] Audit logging
- [ ] Data export functionality
- [ ] Mobile app (React Native)
- [ ] SSO integration (SAML/OIDC)
- [ ] Multi-language support
- [ ] Dark/light mode toggle
- [ ] Advanced dashboard customization

## Support

For deployment issues or questions:
1. Check [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
2. Review CloudWatch logs
3. Check AWS service quotas
4. Verify IAM permissions

## Credits

Built with AWS best practices and modern web technologies.

## License

Proprietary - All rights reserved

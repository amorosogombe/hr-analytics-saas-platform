# HR Analytics SaaS Platform

> AWS-powered multi-tenant productivity analytics platform with real-time dashboards, ETL pipelines, and collaborative insights.

## 🚀 Features

- **Multi-Tenant Architecture** - Isolated data per organization with subdomain routing
- **Real-Time Analytics** - QuickSight embedded dashboards with RLS
- **Automated ETL** - Daily sync from Odoo & Controlio
- **Role-Based Access** - 5-tier permission system
- **Collaborative Comments** - Team discussions on metrics
- **Enterprise Security** - Bank-level encryption, SOC 2 compliant

## 📋 Prerequisites

- AWS Account with admin access
- Node.js 18+ and npm
- Python 3.11+
- AWS CLI configured
- GitHub account

## 🏗️ Architecture
```
External APIs → Lambda ETL → S3 Data Lake → Athena → QuickSight → React App
                     ↓
                 DynamoDB (metadata) → AppSync GraphQL API
                     ↓
                 Cognito (auth)
```

## 📦 Tech Stack

**Infrastructure:** AWS CDK (TypeScript)
**Frontend:** React + TypeScript + Tailwind CSS
**Backend:** Lambda (Python) + AppSync (GraphQL)
**Database:** DynamoDB + S3 Data Lake
**Analytics:** QuickSight + Athena + Glue
**Auth:** Cognito User Pools

## 🚀 Quick Start
```bash
# Clone repository
git clone https://github.com/YOUR_USERNAME/hr-analytics-saas-platform.git
cd hr-analytics-saas-platform

# Install dependencies
cd infrastructure && npm install && cd ..

# Configure environment
cp .env.example .env
# Edit .env with your AWS details

# Deploy infrastructure
cd infrastructure
npm run deploy

# Deploy frontend
cd ../frontend
npm install
npm run build
# Configure AWS Amplify (see docs/DEPLOYMENT.md)
```

## 📖 Documentation

- [User Guide](docs/user-guide.md)
- [Admin Training](docs/admin-training.md)
- [API Documentation](docs/api-documentation.md)
- [Deployment Guide](docs/DEPLOYMENT.md)
- [Sales Materials](docs/sales-materials.md)

## 🏢 Project Structure
```
├── infrastructure/     # CDK infrastructure code
│   ├── bin/           # CDK app entry point
│   ├── lib/           # Stack definitions
│   ├── lambda/        # Lambda function code
│   └── graphql/       # AppSync schema
├── frontend/          # React application
│   └── src/
│       ├── components/
│       ├── contexts/
│       └── hooks/
├── docs/              # Documentation
├── scripts/           # Operational scripts
└── tests/             # Integration tests
```

## 🔧 Development
```bash
# Infrastructure
cd infrastructure
npm run build          # Compile TypeScript
npm run watch          # Watch mode
npm test              # Run tests
npx cdk synth         # Synthesize CloudFormation
npx cdk diff          # Compare deployed stack

# Frontend
cd frontend
npm start             # Development server
npm test              # Run tests
npm run build         # Production build
```

## 🚀 Deployment

See [DEPLOYMENT.md](docs/DEPLOYMENT.md) for detailed step-by-step instructions.

**Quick deploy:**
```bash
cd infrastructure
npx cdk deploy --all
```

## 📊 Monitoring

- **CloudWatch Dashboard:** Monitor all services
- **Health Checks:** `./scripts/health-check.sh`
- **Cost Monitoring:** `./scripts/cost-monitoring.sh`
- **Backups:** `./scripts/backup.sh`

## 🔒 Security

- All data encrypted at rest and in transit
- VPC isolation for Lambda functions
- Secrets stored in AWS Secrets Manager
- Point-in-time recovery enabled
- 7-year audit log retention

## 💰 Cost Estimate

**Starter Organization (50 users):**
- DynamoDB: ~$5-10/month
- Lambda: ~$10-20/month
- S3: ~$5-10/month
- AppSync: ~$4/month
- VPC: ~$32/month (NAT Gateway)
- **Total: ~$60-90/month**

## 📝 License

MIT License - see [LICENSE](LICENSE) file

## 👥 Support

- **Email:** support@yourdomain.com
- **Documentation:** [docs/](docs/)
- **Issues:** GitHub Issues

## 🎯 Roadmap

- [ ] Multi-region deployment
- [ ] Advanced AI insights
- [ ] Mobile app (React Native)
- [ ] Slack/Teams integration
- [ ] White-label option

---

**Built with ❤️ using AWS**

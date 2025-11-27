#!/usr/bin/env node
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
require("source-map-support/register");
const cdk = __importStar(require("aws-cdk-lib"));
const network_stack_1 = require("../lib/network-stack");
const auth_stack_1 = require("../lib/auth-stack");
const storage_stack_1 = require("../lib/storage-stack");
const api_stack_1 = require("../lib/api-stack");
const app = new cdk.App();
const env = {
    account: process.env.CDK_DEFAULT_ACCOUNT || process.env.AWS_ACCOUNT_ID,
    region: 'eu-west-1',
};
const stackProps = {
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
const networkStack = new network_stack_1.NetworkStack(app, 'HRAnalytics-Network', stackProps);
console.log('✅ Network stack defined');
const authStack = new auth_stack_1.AuthStack(app, 'HRAnalytics-Auth', stackProps);
console.log('✅ Auth stack defined');
const storageStack = new storage_stack_1.StorageStack(app, 'HRAnalytics-Storage', {
    ...stackProps,
    vpc: networkStack.vpc,
});
console.log('✅ Storage stack defined');
const apiStack = new api_stack_1.ApiStack(app, 'HRAnalytics-API', {
    ...stackProps,
    userPool: authStack.userPool,
    tables: storageStack.tables,
});
console.log('✅ API stack defined');
apiStack.addDependency(authStack);
apiStack.addDependency(storageStack);
console.log('📦 App synthesis complete');
app.synth();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaHItYW5hbHl0aWNzLWFwcC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImhyLWFuYWx5dGljcy1hcHAudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFDQSx1Q0FBcUM7QUFDckMsaURBQW1DO0FBQ25DLHdEQUFvRDtBQUNwRCxrREFBOEM7QUFDOUMsd0RBQW9EO0FBQ3BELGdEQUE0QztBQUU1QyxNQUFNLEdBQUcsR0FBRyxJQUFJLEdBQUcsQ0FBQyxHQUFHLEVBQUUsQ0FBQztBQUUxQixNQUFNLEdBQUcsR0FBRztJQUNWLE9BQU8sRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLG1CQUFtQixJQUFJLE9BQU8sQ0FBQyxHQUFHLENBQUMsY0FBYztJQUN0RSxNQUFNLEVBQUUsV0FBVztDQUNwQixDQUFDO0FBRUYsTUFBTSxVQUFVLEdBQW1CO0lBQ2pDLEdBQUc7SUFDSCxXQUFXLEVBQUUsNEJBQTRCO0lBQ3pDLElBQUksRUFBRTtRQUNKLE9BQU8sRUFBRSxhQUFhO1FBQ3RCLFdBQVcsRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLFdBQVcsSUFBSSxZQUFZO1FBQ3BELFNBQVMsRUFBRSxLQUFLO1FBQ2hCLE1BQU0sRUFBRSxXQUFXO0tBQ3BCO0NBQ0YsQ0FBQztBQUVGLE9BQU8sQ0FBQyxHQUFHLENBQUMsaURBQWlELENBQUMsQ0FBQztBQUMvRCxPQUFPLENBQUMsR0FBRyxDQUFDLHNCQUFzQixDQUFDLENBQUM7QUFDcEMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxlQUFlLEVBQUUsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0FBRTFDLE1BQU0sWUFBWSxHQUFHLElBQUksNEJBQVksQ0FBQyxHQUFHLEVBQUUscUJBQXFCLEVBQUUsVUFBVSxDQUFDLENBQUM7QUFDOUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDO0FBRXZDLE1BQU0sU0FBUyxHQUFHLElBQUksc0JBQVMsQ0FBQyxHQUFHLEVBQUUsa0JBQWtCLEVBQUUsVUFBVSxDQUFDLENBQUM7QUFDckUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDO0FBRXBDLE1BQU0sWUFBWSxHQUFHLElBQUksNEJBQVksQ0FBQyxHQUFHLEVBQUUscUJBQXFCLEVBQUU7SUFDaEUsR0FBRyxVQUFVO0lBQ2IsR0FBRyxFQUFFLFlBQVksQ0FBQyxHQUFHO0NBQ3RCLENBQUMsQ0FBQztBQUNILE9BQU8sQ0FBQyxHQUFHLENBQUMseUJBQXlCLENBQUMsQ0FBQztBQUV2QyxNQUFNLFFBQVEsR0FBRyxJQUFJLG9CQUFRLENBQUMsR0FBRyxFQUFFLGlCQUFpQixFQUFFO0lBQ3BELEdBQUcsVUFBVTtJQUNiLFFBQVEsRUFBRSxTQUFTLENBQUMsUUFBUTtJQUM1QixNQUFNLEVBQUUsWUFBWSxDQUFDLE1BQU07Q0FDNUIsQ0FBQyxDQUFDO0FBQ0gsT0FBTyxDQUFDLEdBQUcsQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDO0FBRW5DLFFBQVEsQ0FBQyxhQUFhLENBQUMsU0FBUyxDQUFDLENBQUM7QUFDbEMsUUFBUSxDQUFDLGFBQWEsQ0FBQyxZQUFZLENBQUMsQ0FBQztBQUVyQyxPQUFPLENBQUMsR0FBRyxDQUFDLDJCQUEyQixDQUFDLENBQUM7QUFFekMsR0FBRyxDQUFDLEtBQUssRUFBRSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiIyEvdXNyL2Jpbi9lbnYgbm9kZVxuaW1wb3J0ICdzb3VyY2UtbWFwLXN1cHBvcnQvcmVnaXN0ZXInO1xuaW1wb3J0ICogYXMgY2RrIGZyb20gJ2F3cy1jZGstbGliJztcbmltcG9ydCB7IE5ldHdvcmtTdGFjayB9IGZyb20gJy4uL2xpYi9uZXR3b3JrLXN0YWNrJztcbmltcG9ydCB7IEF1dGhTdGFjayB9IGZyb20gJy4uL2xpYi9hdXRoLXN0YWNrJztcbmltcG9ydCB7IFN0b3JhZ2VTdGFjayB9IGZyb20gJy4uL2xpYi9zdG9yYWdlLXN0YWNrJztcbmltcG9ydCB7IEFwaVN0YWNrIH0gZnJvbSAnLi4vbGliL2FwaS1zdGFjayc7XG5cbmNvbnN0IGFwcCA9IG5ldyBjZGsuQXBwKCk7XG5cbmNvbnN0IGVudiA9IHtcbiAgYWNjb3VudDogcHJvY2Vzcy5lbnYuQ0RLX0RFRkFVTFRfQUNDT1VOVCB8fCBwcm9jZXNzLmVudi5BV1NfQUNDT1VOVF9JRCxcbiAgcmVnaW9uOiAnZXUtd2VzdC0xJyxcbn07XG5cbmNvbnN0IHN0YWNrUHJvcHM6IGNkay5TdGFja1Byb3BzID0ge1xuICBlbnYsXG4gIGRlc2NyaXB0aW9uOiAnSFIgQW5hbHl0aWNzIFNhYVMgUGxhdGZvcm0nLFxuICB0YWdzOiB7XG4gICAgUHJvamVjdDogJ0hSQW5hbHl0aWNzJyxcbiAgICBFbnZpcm9ubWVudDogcHJvY2Vzcy5lbnYuRU5WSVJPTk1FTlQgfHwgJ3Byb2R1Y3Rpb24nLFxuICAgIE1hbmFnZWRCeTogJ0NESycsXG4gICAgUmVnaW9uOiAnZXUtd2VzdC0xJyxcbiAgfSxcbn07XG5cbmNvbnNvbGUubG9nKCfwn5qAIEluaXRpYWxpemluZyBIUiBBbmFseXRpY3MgUGxhdGZvcm0gc3RhY2tzLi4uJyk7XG5jb25zb2xlLmxvZygn8J+TjSBSZWdpb246IGV1LXdlc3QtMScpO1xuY29uc29sZS5sb2coJ/Cfj5fvuI8gIEFjY291bnQ6JywgZW52LmFjY291bnQpO1xuXG5jb25zdCBuZXR3b3JrU3RhY2sgPSBuZXcgTmV0d29ya1N0YWNrKGFwcCwgJ0hSQW5hbHl0aWNzLU5ldHdvcmsnLCBzdGFja1Byb3BzKTtcbmNvbnNvbGUubG9nKCfinIUgTmV0d29yayBzdGFjayBkZWZpbmVkJyk7XG5cbmNvbnN0IGF1dGhTdGFjayA9IG5ldyBBdXRoU3RhY2soYXBwLCAnSFJBbmFseXRpY3MtQXV0aCcsIHN0YWNrUHJvcHMpO1xuY29uc29sZS5sb2coJ+KchSBBdXRoIHN0YWNrIGRlZmluZWQnKTtcblxuY29uc3Qgc3RvcmFnZVN0YWNrID0gbmV3IFN0b3JhZ2VTdGFjayhhcHAsICdIUkFuYWx5dGljcy1TdG9yYWdlJywge1xuICAuLi5zdGFja1Byb3BzLFxuICB2cGM6IG5ldHdvcmtTdGFjay52cGMsXG59KTtcbmNvbnNvbGUubG9nKCfinIUgU3RvcmFnZSBzdGFjayBkZWZpbmVkJyk7XG5cbmNvbnN0IGFwaVN0YWNrID0gbmV3IEFwaVN0YWNrKGFwcCwgJ0hSQW5hbHl0aWNzLUFQSScsIHtcbiAgLi4uc3RhY2tQcm9wcyxcbiAgdXNlclBvb2w6IGF1dGhTdGFjay51c2VyUG9vbCxcbiAgdGFibGVzOiBzdG9yYWdlU3RhY2sudGFibGVzLFxufSk7XG5jb25zb2xlLmxvZygn4pyFIEFQSSBzdGFjayBkZWZpbmVkJyk7XG5cbmFwaVN0YWNrLmFkZERlcGVuZGVuY3koYXV0aFN0YWNrKTtcbmFwaVN0YWNrLmFkZERlcGVuZGVuY3koc3RvcmFnZVN0YWNrKTtcblxuY29uc29sZS5sb2coJ/Cfk6YgQXBwIHN5bnRoZXNpcyBjb21wbGV0ZScpO1xuXG5hcHAuc3ludGgoKTtcbiJdfQ==
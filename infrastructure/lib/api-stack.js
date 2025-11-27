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
exports.ApiStack = void 0;
// infrastructure/lib/api-stack.ts
const cdk = __importStar(require("aws-cdk-lib"));
const appsync = __importStar(require("aws-cdk-lib/aws-appsync"));
const lambda = __importStar(require("aws-cdk-lib/aws-lambda"));
const iam = __importStar(require("aws-cdk-lib/aws-iam"));
const path = __importStar(require("path"));
class ApiStack extends cdk.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        console.log('🔌 Creating AppSync GraphQL API...');
        this.resolvers = {};
        // AppSync GraphQL API
        this.api = new appsync.GraphqlApi(this, 'HRAnalyticsAPI', {
            name: 'hr-analytics-api',
            definition: appsync.Definition.fromFile(path.join(__dirname, '../graphql/schema.graphql')),
            authorizationConfig: {
                defaultAuthorization: {
                    authorizationType: appsync.AuthorizationType.USER_POOL,
                    userPoolConfig: {
                        userPool: props.userPool,
                    },
                },
                additionalAuthorizationModes: [
                    {
                        authorizationType: appsync.AuthorizationType.IAM,
                    },
                ],
            },
            xrayEnabled: true,
            logConfig: {
                fieldLogLevel: appsync.FieldLogLevel.ERROR,
                excludeVerboseContent: false,
            },
        });
        // DynamoDB Data Sources
        const orgDataSource = this.api.addDynamoDbDataSource('OrganizationsDataSource', props.tables.organizations);
        const usersDataSource = this.api.addDynamoDbDataSource('UsersDataSource', props.tables.users);
        const commentsDataSource = this.api.addDynamoDbDataSource('CommentsDataSource', props.tables.comments);
        // Lambda Resolvers for Super Admin Operations
        this.createLambdaResolver('ListAllOrganizations', 'listAllOrganizations', 'Query', props.tables.organizations, ['SuperAdmins']);
        this.createLambdaResolver('GetSystemMetrics', 'getSystemMetrics', 'Query', props.tables.organizations, ['SuperAdmins']);
        this.createLambdaResolver('ApproveOrganization', 'approveOrganization', 'Mutation', props.tables.organizations, ['SuperAdmins']);
        this.createLambdaResolver('RejectOrganization', 'rejectOrganization', 'Mutation', props.tables.organizations, ['SuperAdmins']);
        this.createLambdaResolver('SuspendOrganization', 'suspendOrganization', 'Mutation', props.tables.organizations, ['SuperAdmins']);
        // Direct DynamoDB Resolvers (no Lambda needed)
        // Get Organization
        orgDataSource.createResolver('GetOrganizationResolver', {
            typeName: 'Query',
            fieldName: 'getOrganization',
            requestMappingTemplate: appsync.MappingTemplate.dynamoDbGetItem('organizationId', 'organizationId'),
            responseMappingTemplate: appsync.MappingTemplate.dynamoDbResultItem(),
        });
        // Create Organization
        this.createLambdaResolver('CreateOrganization', 'createOrganization', 'Mutation', props.tables.organizations, ['SuperAdmins']);
        // Outputs
        new cdk.CfnOutput(this, 'GraphQLAPIURL', {
            value: this.api.graphqlUrl,
            description: 'AppSync GraphQL API URL',
            exportName: 'HRAnalytics-GraphQLAPIURL',
        });
        new cdk.CfnOutput(this, 'GraphQLAPIKey', {
            value: this.api.apiKey || 'N/A',
            description: 'AppSync API Key (if enabled)',
            exportName: 'HRAnalytics-GraphQLAPIKey',
        });
        console.log('✅ AppSync GraphQL API created successfully');
    }
    createLambdaResolver(id, functionName, typeName, table, allowedGroups) {
        // Create Lambda function
        const lambdaFunction = new lambda.Function(this, `${id}Lambda`, {
            functionName: `hr-analytics-${functionName}`,
            runtime: lambda.Runtime.NODEJS_18_X,
            handler: 'index.handler',
            code: lambda.Code.fromAsset(path.join(__dirname, `../lambda/api/${functionName}`)),
            timeout: cdk.Duration.seconds(30),
            memorySize: 1024,
            environment: {
                ORGANIZATIONS_TABLE: table.tableName,
                ALLOWED_GROUPS: allowedGroups.join(','),
            },
            tracing: lambda.Tracing.ACTIVE,
        });
        // Grant permissions
        table.grantReadWriteData(lambdaFunction);
        // Additional permissions for approve/suspend operations
        if (functionName === 'approveOrganization' ||
            functionName === 'suspendOrganization') {
            lambdaFunction.addToRolePolicy(new iam.PolicyStatement({
                actions: [
                    'ses:SendEmail',
                    'ses:SendRawEmail',
                    'cognito-idp:AdminCreateUser',
                    'cognito-idp:AdminAddUserToGroup',
                    'route53:ChangeResourceRecordSets',
                    'lambda:InvokeFunction',
                ],
                resources: ['*'],
            }));
        }
        // Create AppSync data source
        const dataSource = this.api.addLambdaDataSource(`${id}DataSource`, lambdaFunction);
        // Create resolver
        dataSource.createResolver(`${id}Resolver`, {
            typeName: typeName,
            fieldName: functionName,
        });
        this.resolvers[functionName] = lambdaFunction;
    }
}
exports.ApiStack = ApiStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBpLXN0YWNrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiYXBpLXN0YWNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsa0NBQWtDO0FBQ2xDLGlEQUFtQztBQUNuQyxpRUFBbUQ7QUFHbkQsK0RBQWlEO0FBQ2pELHlEQUEyQztBQUUzQywyQ0FBNkI7QUFPN0IsTUFBYSxRQUFTLFNBQVEsR0FBRyxDQUFDLEtBQUs7SUFJckMsWUFBWSxLQUFnQixFQUFFLEVBQVUsRUFBRSxLQUFvQjtRQUM1RCxLQUFLLENBQUMsS0FBSyxFQUFFLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUV4QixPQUFPLENBQUMsR0FBRyxDQUFDLG9DQUFvQyxDQUFDLENBQUM7UUFFbEQsSUFBSSxDQUFDLFNBQVMsR0FBRyxFQUFFLENBQUM7UUFFcEIsc0JBQXNCO1FBQ3RCLElBQUksQ0FBQyxHQUFHLEdBQUcsSUFBSSxPQUFPLENBQUMsVUFBVSxDQUFDLElBQUksRUFBRSxnQkFBZ0IsRUFBRTtZQUN4RCxJQUFJLEVBQUUsa0JBQWtCO1lBQ3hCLFVBQVUsRUFBRSxPQUFPLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FDckMsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsMkJBQTJCLENBQUMsQ0FDbEQ7WUFDRCxtQkFBbUIsRUFBRTtnQkFDbkIsb0JBQW9CLEVBQUU7b0JBQ3BCLGlCQUFpQixFQUFFLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQyxTQUFTO29CQUN0RCxjQUFjLEVBQUU7d0JBQ2QsUUFBUSxFQUFFLEtBQUssQ0FBQyxRQUFRO3FCQUN6QjtpQkFDRjtnQkFDRCw0QkFBNEIsRUFBRTtvQkFDNUI7d0JBQ0UsaUJBQWlCLEVBQUUsT0FBTyxDQUFDLGlCQUFpQixDQUFDLEdBQUc7cUJBQ2pEO2lCQUNGO2FBQ0Y7WUFDRCxXQUFXLEVBQUUsSUFBSTtZQUNqQixTQUFTLEVBQUU7Z0JBQ1QsYUFBYSxFQUFFLE9BQU8s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QkFBNkI7UUFDN0IsTUFBTSxVQUFVLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxtQkFBbUIsQ0FBQyxHQUFHLEVBQUUsWUFBWSxFQUFFLGNBQWMsQ0FBQyxDQUFDO1FBRW5GLGtCQUFrQjtRQUNsQixVQUFVLENBQUMsY0FBYyxDQUFDLEdBQUcsRUFBRSxVQUFVLEVBQUU7WUFDekMsUUFBUSxFQUFFLFFBQVE7WUFDbEIsU0FBUyxFQUFFLFlBQVk7U0FDeEIsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLFNBQVMsQ0FBQyxZQUFZLENBQUMsR0FBRyxjQUFjLENBQUM7SUFDaEQsQ0FBQztDQUNGO0FBN0xELDRCQTZMQyIsInNvdXJjZXNDb250ZW50IjpbIi8vIGluZnJhc3RydWN0dXJlL2xpYi9hcGktc3RhY2sudHNcbmltcG9ydCAqIGFzIGNkayBmcm9tICdhd3MtY2RrLWxpYic7XG5pbXBvcnQgKiBhcyBhcHBzeW5jIGZyb20gJ2F3cy1jZGstbGliL2F3cy1hcHBzeW5jJztcbmltcG9ydCAqIGFzIGNvZ25pdG8gZnJvbSAnYXdzLWNkay1saWIvYXdzLWNvZ25pdG8nO1xuaW1wb3J0ICogYXMgZHluYW1vZGIgZnJvbSAnYXdzLWNkay1saWIvYXdzLWR5bmFtb2RiJztcbmltcG9ydCAqIGFzIGxhbWJkYSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtbGFtYmRhJztcbmltcG9ydCAqIGFzIGlhbSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtaWFtJztcbmltcG9ydCB7IENvbnN0cnVjdCB9IGZyb20gJ2NvbnN0cnVjdHMnO1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJztcblxuZXhwb3J0IGludGVyZmFjZSBBcGlTdGFja1Byb3BzIGV4dGVuZHMgY2RrLlN0YWNrUHJvcHMge1xuICB1c2VyUG9vbDogY29nbml0by5Vc2VyUG9vbDtcbiAgdGFibGVzOiB7IFtrZXk6IHN0cmluZ106IGR5bmFtb2RiLlRhYmxlIH07XG59XG5cbmV4cG9ydCBjbGFzcyBBcGlTdGFjayBleHRlbmRzIGNkay5TdGFjayB7XG4gIHB1YmxpYyByZWFkb25seSBhcGk6IGFwcHN5bmMuR3JhcGhxbEFwaTtcbiAgcHVibGljIHJlYWRvbmx5IHJlc29sdmVyczogeyBba2V5OiBzdHJpbmddOiBsYW1iZGEuRnVuY3Rpb24gfTtcblxuICBjb25zdHJ1Y3RvcihzY29wZTogQ29uc3RydWN0LCBpZDogc3RyaW5nLCBwcm9wczogQXBpU3RhY2tQcm9wcykge1xuICAgIHN1cGVyKHNjb3BlLCBpZCwgcHJvcHMpO1xuXG4gICAgY29uc29sZS5sb2coJ/CflIwgQ3JlYXRpbmcgQXBwU3luYyBHcmFwaFFMIEFQSS4uLicpO1xuXG4gICAgdGhpcy5yZXNvbHZlcnMgPSB7fTtcblxuICAgIC8vIEFwcFN5bmMgR3JhcGhRTCBBUElcbiAgICB0aGlzLmFwaSA9IG5ldyBhcHBzeW5jLkdyYXBocWxBcGkodGhpcywgJ0hSQW5hbHl0aWNzQVBJJywge1xuICAgICAgbmFtZTogJ2hyLWFuYWx5dGljcy1hcGknLFxuICAgICAgZGVmaW5pdGlvbjogYXBwc3luYy5EZWZpbml0aW9uLmZyb21GaWxlKFxuICAgICAgICBwYXRoLmpvaW4oX19kaXJuYW1lLCAnLi4vZ3JhcGhxbC9zY2hlbWEuZ3JhcGhxbCcpXG4gICAgICApLFxuICAgICAgYXV0aG9yaXphdGlvbkNvbmZpZzoge1xuICAgICAgICBkZWZhdWx0QXV0aG9yaXphdGlvbjoge1xuICAgICAgICAgIGF1dGhvcml6YXRpb25UeXBlOiBhcHBzeW5jLkF1dGhvcml6YXRpb25UeXBlLlVTRVJfUE9PTCxcbiAgICAgICAgICB1c2VyUG9vbENvbmZpZzoge1xuICAgICAgICAgICAgdXNlclBvb2w6IHByb3BzLnVzZXJQb29sLFxuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIGFkZGl0aW9uYWxBdXRob3JpemF0aW9uTW9kZXM6IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICBhdXRob3JpemF0aW9uVHlwZTogYXBwc3luYy5BdXRob3JpemF0aW9uVHlwZS5JQU0sXG4gICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICAgIH0sXG4gICAgICB4cmF5RW5hYmxlZDogdHJ1ZSxcbiAgICAgIGxvZ0NvbmZpZzoge1xuICAgICAgICBmaWVsZExvZ0xldmVsOiBhcHBzeW5jLkZpZWxkTG9nTGV2ZWwuRVJST1IsXG4gICAgICAgIGV4Y2x1ZGVWZXJib3NlQ29udGVudDogZmFsc2UsXG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgLy8gRHluYW1vREIgRGF0YSBTb3VyY2VzXG4gICAgY29uc3Qgb3JnRGF0YVNvdXJjZSA9IHRoaXMuYXBpLmFkZER5bmFtb0RiRGF0YVNvdXJjZShcbiAgICAgICdPcmdhbml6YXRpb25zRGF0YVNvdXJjZScsXG4gICAgICBwcm9wcy50YWJsZXMub3JnYW5pemF0aW9uc1xuICAgICk7XG5cbiAgICBjb25zdCB1c2Vyc0RhdGFTb3VyY2UgPSB0aGlzLmFwaS5hZGREeW5hbW9EYkRhdGFTb3VyY2UoXG4gICAgICAnVXNlcnNEYXRhU291cmNlJyxcbiAgICAgIHByb3BzLnRhYmxlcy51c2Vyc1xuICAgICk7XG5cbiAgICBjb25zdCBjb21tZW50c0RhdGFTb3VyY2UgPSB0aGlzLmFwaS5hZGREeW5hbW9EYkRhdGFTb3VyY2UoXG4gICAgICAnQ29tbWVudHNEYXRhU291cmNlJyxcbiAgICAgIHByb3BzLnRhYmxlcy5jb21tZW50c1xuICAgICk7XG5cbiAgICAvLyBMYW1iZGEgUmVzb2x2ZXJzIGZvciBTdXBlciBBZG1pbiBPcGVyYXRpb25zXG4gICAgdGhpcy5jcmVhdGVMYW1iZGFSZXNvbHZlcihcbiAgICAgICdMaXN0QWxsT3JnYW5pemF0aW9ucycsXG4gICAgICAnbGlzdEFsbE9yZ2FuaXphdGlvbnMnLFxuICAgICAgJ1F1ZXJ5JyxcbiAgICAgIHByb3BzLnRhYmxlcy5vcmdhbml6YXRpb25zLFxuICAgICAgWydTdXBlckFkbWlucyddXG4gICAgKTtcblxuICAgIHRoaXMuY3JlYXRlTGFtYmRhUmVzb2x2ZXIoXG4gICAgICAnR2V0U3lzdGVtTWV0cmljcycsXG4gICAgICAnZ2V0U3lzdGVtTWV0cmljcycsXG4gICAgICAnUXVlcnknLFxuICAgICAgcHJvcHMudGFibGVzLm9yZ2FuaXphdGlvbnMsXG4gICAgICBbJ1N1cGVyQWRtaW5zJ11cbiAgICApO1xuXG4gICAgdGhpcy5jcmVhdGVMYW1iZGFSZXNvbHZlcihcbiAgICAgICdBcHByb3ZlT3JnYW5pemF0aW9uJyxcbiAgICAgICdhcHByb3ZlT3JnYW5pemF0aW9uJyxcbiAgICAgICdNdXRhdGlvbicsXG4gICAgICBwcm9wcy50YWJsZXMub3JnYW5pemF0aW9ucyxcbiAgICAgIFsnU3VwZXJBZG1pbnMnXVxuICAgICk7XG5cbiAgICB0aGlzLmNyZWF0ZUxhbWJkYVJlc29sdmVyKFxuICAgICAgJ1JlamVjdE9yZ2FuaXphdGlvbicsXG4gICAgICAncmVqZWN0T3JnYW5pemF0aW9uJyxcbiAgICAgICdNdXRhdGlvbicsXG4gICAgICBwcm9wcy50YWJsZXMub3JnYW5pemF0aW9ucyxcbiAgICAgIFsnU3VwZXJBZG1pbnMnXVxuICAgICk7XG5cbiAgICB0aGlzLmNyZWF0ZUxhbWJkYVJlc29sdmVyKFxuICAgICAgJ1N1c3BlbmRPcmdhbml6YXRpb24nLFxuICAgICAgJ3N1c3BlbmRPcmdhbml6YXRpb24nLFxuICAgICAgJ011dGF0aW9uJyxcbiAgICAgIHByb3BzLnRhYmxlcy5vcmdhbml6YXRpb25zLFxuICAgICAgWydTdXBlckFkbWlucyddXG4gICAgKTtcblxuICAgIC8vIERpcmVjdCBEeW5hbW9EQiBSZXNvbHZlcnMgKG5vIExhbWJkYSBuZWVkZWQpXG4gICAgLy8gR2V0IE9yZ2FuaXphdGlvblxuICAgIG9yZ0RhdGFTb3VyY2UuY3JlYXRlUmVzb2x2ZXIoJ0dldE9yZ2FuaXphdGlvblJlc29sdmVyJywge1xuICAgICAgdHlwZU5hbWU6ICdRdWVyeScsXG4gICAgICBmaWVsZE5hbWU6ICdnZXRPcmdhbml6YXRpb24nLFxuICAgICAgcmVxdWVzdE1hcHBpbmdUZW1wbGF0ZTogYXBwc3luYy5NYXBwaW5nVGVtcGxhdGUuZHluYW1vRGJHZXRJdGVtKFxuICAgICAgICAnb3JnYW5pemF0aW9uSWQnLFxuICAgICAgICAnb3JnYW5pemF0aW9uSWQnXG4gICAgICApLFxuICAgICAgcmVzcG9uc2VNYXBwaW5nVGVtcGxhdGU6IGFwcHN5bmMuTWFwcGluZ1RlbXBsYXRlLmR5bmFtb0RiUmVzdWx0SXRlbSgpLFxuICAgIH0pO1xuXG4gICAgLy8gQ3JlYXRlIE9yZ2FuaXphdGlvblxuICAgIHRoaXMuY3JlYXRlTGFtYmRhUmVzb2x2ZXIoXG4gICAgICAnQ3JlYXRlT3JnYW5pemF0aW9uJyxcbiAgICAgICdjcmVhdGVPcmdhbml6YXRpb24nLFxuICAgICAgJ011dGF0aW9uJyxcbiAgICAgIHByb3BzLnRhYmxlcy5vcmdhbml6YXRpb25zLFxuICAgICAgWydTdXBlckFkbWlucyddXG4gICAgKTtcblxuICAgIC8vIE91dHB1dHNcbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnR3JhcGhRTEFQSVVSTCcsIHtcbiAgICAgIHZhbHVlOiB0aGlzLmFwaS5ncmFwaHFsVXJsLFxuICAgICAgZGVzY3JpcHRpb246ICdBcHBTeW5jIEdyYXBoUUwgQVBJIFVSTCcsXG4gICAgICBleHBvcnROYW1lOiAnSFJBbmFseXRpY3MtR3JhcGhRTEFQSVVSTCcsXG4gICAgfSk7XG5cbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnR3JhcGhRTEFQSUtleScsIHtcbiAgICAgIHZhbHVlOiB0aGlzLmFwaS5hcGlLZXkgfHwgJ04vQScsXG4gICAgICBkZXNjcmlwdGlvbjogJ0FwcFN5bmMgQVBJIEtleSAoaWYgZW5hYmxlZCknLFxuICAgICAgZXhwb3J0TmFtZTogJ0hSQW5hbHl0aWNzLUdyYXBoUUxBUElLZXknLFxuICAgIH0pO1xuXG4gICAgY29uc29sZS5sb2coJ+KchSBBcHBTeW5jIEdyYXBoUUwgQVBJIGNyZWF0ZWQgc3VjY2Vzc2Z1bGx5Jyk7XG4gIH1cblxuICBwcml2YXRlIGNyZWF0ZUxhbWJkYVJlc29sdmVyKFxuICAgIGlkOiBzdHJpbmcsXG4gICAgZnVuY3Rpb25OYW1lOiBzdHJpbmcsXG4gICAgdHlwZU5hbWU6IHN0cmluZyxcbiAgICB0YWJsZTogZHluYW1vZGIuVGFibGUsXG4gICAgYWxsb3dlZEdyb3Vwczogc3RyaW5nW11cbiAgKSB7XG4gICAgLy8gQ3JlYXRlIExhbWJkYSBmdW5jdGlvblxuICAgIGNvbnN0IGxhbWJkYUZ1bmN0aW9uID0gbmV3IGxhbWJkYS5GdW5jdGlvbih0aGlzLCBgJHtpZH1MYW1iZGFgLCB7XG4gICAgICBmdW5jdGlvbk5hbWU6IGBoci1hbmFseXRpY3MtJHtmdW5jdGlvbk5hbWV9YCxcbiAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLk5PREVKU18xOF9YLFxuICAgICAgaGFuZGxlcjogJ2luZGV4LmhhbmRsZXInLFxuICAgICAgY29kZTogbGFtYmRhLkNvZGUuZnJvbUFzc2V0KFxuICAgICAgICBwYXRoLmpvaW4oX19kaXJuYW1lLCBgLi4vbGFtYmRhL2FwaS8ke2Z1bmN0aW9uTmFtZX1gKVxuICAgICAgKSxcbiAgICAgIHRpbWVvdXQ6IGNkay5EdXJhdGlvbi5zZWNvbmRzKDMwKSxcbiAgICAgIG1lbW9yeVNpemU6IDEwMjQsXG4gICAgICBlbnZpcm9ubWVudDoge1xuICAgICAgICBPUkdBTklaQVRJT05TX1RBQkxFOiB0YWJsZS50YWJsZU5hbWUsXG4gICAgICAgIEFMTE9XRURfR1JPVVBTOiBhbGxvd2VkR3JvdXBzLmpvaW4oJywnKSxcbiAgICAgIH0sXG4gICAgICB0cmFjaW5nOiBsYW1iZGEuVHJhY2luZy5BQ1RJVkUsXG4gICAgfSk7XG5cbiAgICAvLyBHcmFudCBwZXJtaXNzaW9uc1xuICAgIHRhYmxlLmdyYW50UmVhZFdyaXRlRGF0YShsYW1iZGFGdW5jdGlvbik7XG5cbiAgICAvLyBBZGRpdGlvbmFsIHBlcm1pc3Npb25zIGZvciBhcHByb3ZlL3N1c3BlbmQgb3BlcmF0aW9uc1xuICAgIGlmIChcbiAgICAgIGZ1bmN0aW9uTmFtZSA9PT0gJ2FwcHJvdmVPcmdhbml6YXRpb24nIHx8XG4gICAgICBmdW5jdGlvbk5hbWUgPT09ICdzdXNwZW5kT3JnYW5pemF0aW9uJ1xuICAgICkge1xuICAgICAgbGFtYmRhRnVuY3Rpb24uYWRkVG9Sb2xlUG9saWN5KFxuICAgICAgICBuZXcgaWFtLlBvbGljeVN0YXRlbWVudCh7XG4gICAgICAgICAgYWN0aW9uczogW1xuICAgICAgICAgICAgJ3NlczpTZW5kRW1haWwnLFxuICAgICAgICAgICAgJ3NlczpTZW5kUmF3RW1haWwnLFxuICAgICAgICAgICAgJ2NvZ25pdG8taWRwOkFkbWluQ3JlYXRlVXNlcicsXG4gICAgICAgICAgICAnY29nbml0by1pZHA6QWRtaW5BZGRVc2VyVG9Hcm91cCcsXG4gICAgICAgICAgICAncm91dGU1MzpDaGFuZ2VSZXNvdXJjZVJlY29yZFNldHMnLFxuICAgICAgICAgICAgJ2xhbWJkYTpJbnZva2VGdW5jdGlvbicsXG4gICAgICAgICAgXSxcbiAgICAgICAgICByZXNvdXJjZXM6IFsnKiddLFxuICAgICAgICB9KVxuICAgICAgKTtcbiAgICB9XG5cbiAgICAvLyBDcmVhdGUgQXBwU3luYyBkYXRhIHNvdXJjZVxuICAgIGNvbnN0IGRhdGFTb3VyY2UgPSB0aGlzLmFwaS5hZGRMYW1iZGFEYXRhU291cmNlKGAke2lkfURhdGFTb3VyY2VgLCBsYW1iZGFGdW5jdGlvbik7XG5cbiAgICAvLyBDcmVhdGUgcmVzb2x2ZXJcbiAgICBkYXRhU291cmNlLmNyZWF0ZVJlc29sdmVyKGAke2lkfVJlc29sdmVyYCwge1xuICAgICAgdHlwZU5hbWU6IHR5cGVOYW1lLFxuICAgICAgZmllbGROYW1lOiBmdW5jdGlvbk5hbWUsXG4gICAgfSk7XG5cbiAgICB0aGlzLnJlc29sdmVyc1tmdW5jdGlvbk5hbWVdID0gbGFtYmRhRnVuY3Rpb247XG4gIH1cbn1cbiJdfQ==
// src/aws-config.js
// Replace these values with your actual AWS resource IDs from CDK outputs

export const awsConfig = {
  Auth: {
    Cognito: {
      userPoolId: 'YOUR_USER_POOL_ID', // From AuthStack output
      userPoolClientId: 'YOUR_USER_POOL_CLIENT_ID', // From AuthStack output
      loginWith: {
        email: true,
      },
      signUpVerificationMethod: 'code',
      userAttributes: {
        email: {
          required: true,
        },
      },
      passwordFormat: {
        minLength: 12,
        requireLowercase: true,
        requireUppercase: true,
        requireNumbers: true,
        requireSpecialCharacters: true,
      },
    },
  },
  API: {
    REST: {
      'HRAnalyticsAPI': {
        endpoint: 'YOUR_API_GATEWAY_URL', // From ApiStack output
        region: 'us-east-1', // Your AWS region
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

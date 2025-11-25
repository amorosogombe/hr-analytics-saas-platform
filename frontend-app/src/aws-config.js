// src/aws-config.js
// AWS configuration with actual resource values from CDK deployment
export const awsConfig = {
  Auth: {
    Cognito: {
      userPoolId: process.env.REACT_APP_USER_POOL_ID || 'eu-west-1_uEbTONYVT',
      userPoolClientId: process.env.REACT_APP_USER_POOL_CLIENT_ID || '1ranm65v7jnt1f3s9i7m6rug00',
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
        minLength: 8,
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
        endpoint: process.env.REACT_APP_API_URL || 'https://1n8ay3my8e.execute-api.eu-west-1.amazonaws.com/prod',
        region: process.env.REACT_APP_AWS_REGION || 'eu-west-1',
      },
    },
  },
};

export const APP_CONFIG = {
  apiUrl: process.env.REACT_APP_API_URL || 'https://1n8ay3my8e.execute-api.eu-west-1.amazonaws.com/prod',
  region: process.env.REACT_APP_AWS_REGION || 'eu-west-1',
  quicksightDashboards: {
    controlio: process.env.REACT_APP_CONTROLIO_DASHBOARD_ID || '',
    hrProductivity: process.env.REACT_APP_HR_PRODUCTIVITY_DASHBOARD_ID || '',
  },
};

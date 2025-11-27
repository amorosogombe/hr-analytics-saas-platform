// src/aws-config.js
// AWS Configuration with actual resource IDs

export const awsConfig = {
  Auth: {
    Cognito: {
      userPoolId: 'eu-west-1_uEbTONYVT',
      userPoolClientId: '1ranm65v7jnt1f3s9i7m6rug00',
      loginWith: { email: true },
      signUpVerificationMethod: 'code',
      userAttributes: { email: { required: true } },
      passwordFormat: { minLength: 12, requireLowercase: true, requireUppercase: true, requireNumbers: true, requireSpecialCharacters: true },
    },
  },
  API: {
    REST: {
      'HRAnalyticsAPI': {
        endpoint: 'https://1n8ay3my8e.execute-api.eu-west-1.amazonaws.com/prod',
        region: 'eu-west-1',
      },
    },
  },
};

export const APP_CONFIG = {
  apiUrl: 'https://1n8ay3my8e.execute-api.eu-west-1.amazonaws.com/prod',
  region: 'eu-west-1',
  quicksightDashboards: {
    controlio: 'controlio-dashboard',
    hrProductivity: 'hr-productivity-dashboard',
  },
};

import type { ResourcesConfig } from 'aws-amplify';

export const awsConfig: ResourcesConfig = {
  Auth: {
    Cognito: {
      userPoolId: process.env.REACT_APP_USER_POOL_ID || '',
      userPoolClientId: process.env.REACT_APP_USER_POOL_CLIENT_ID || '',
      loginWith: {
        email: true,
      },
    },
  },
};

if (process.env.NODE_ENV === 'development') {
  console.log('AWS Config loaded:', {
    region: process.env.REACT_APP_AWS_REGION,
    userPoolId: awsConfig.Auth?.Cognito?.userPoolId ? '✓ Set' : '✗ Missing',
    clientId: awsConfig.Auth?.Cognito?.userPoolClientId ? '✓ Set' : '✗ Missing',
  });
}

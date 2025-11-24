import type { ResourcesConfig } from 'aws-amplify';

export const awsConfig: ResourcesConfig = {
  Auth: {
    Cognito: {
      userPoolId: import.meta.env.VITE_USER_POOL_ID || '',
      userPoolClientId: import.meta.env.VITE_USER_POOL_CLIENT_ID || '',
      loginWith: {
        email: true,
      },
    },
  },
};

// For development, log configuration (remove in production)
if (import.meta.env.MODE === 'development') {
  console.log('AWS Config loaded:', {
    region: import.meta.env.VITE_AWS_REGION,
    userPoolId: awsConfig.Auth?.Cognito?.userPoolId ? '✓ Set' : '✗ Missing',
    clientId: awsConfig.Auth?.Cognito?.userPoolClientId ? '✓ Set' : '✗ Missing',
  });
}

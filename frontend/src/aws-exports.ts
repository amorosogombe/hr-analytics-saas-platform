// AWS Configuration for HR Analytics Platform
const awsConfig = {
  Auth: {
    region: 'eu-west-1',
    userPoolId: 'eu-west-1_pIy6VWGqJ',
    userPoolWebClientId: '1easptj36sfe4gh7trn106pj11',
    mandatorySignIn: true,
    authenticationFlowType: 'USER_SRP_AUTH'
  },
  API: {
    GraphQL: {
      endpoint: 'https://sbbyxocltbeh3jpgirue4pg5qm.appsync-api.eu-west-1.amazonaws.com/graphql',
      region: 'eu-west-1',
      defaultAuthMode: 'userPool'
    }
  }
};

export default awsConfig;

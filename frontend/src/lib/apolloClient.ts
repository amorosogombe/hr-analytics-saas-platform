import { ApolloClient, InMemoryCache, createHttpLink, HttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { fetchAuthSession } from 'aws-amplify/auth';

const httpLink = new HttpLink({
  uri: 'https://sbbyxocltbeh3jpgirue4pg5qm.appsync-api.eu-west-1.amazonaws.com/graphql',
});

const authLink = setContext(async (_, { headers }) => {
  try {
    const session = await fetchAuthSession();
    const token = session.tokens?.idToken?.toString();
    
    return {
      headers: {
        ...headers,
        authorization: token ? token : '',
      }
    };
  } catch (error) {
    console.error('Error getting auth token:', error);
    return { headers };
  }
});

export const apolloClient = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});

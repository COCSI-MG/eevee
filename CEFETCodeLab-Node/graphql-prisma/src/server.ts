import { ApolloServer } from '@apollo/server';
import typeDefs from './typeDefs';

const studentResolvers = require('./resolvers').default || require('./resolvers');

export function createApolloServer() {
  const server = new ApolloServer({
    typeDefs,
    resolvers: studentResolvers,
  });
  return server;
}
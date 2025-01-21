'use strict';
require('./utils/database');
const express = require('express');
const { makeExecutableSchema } = require('@graphql-tools/schema');
const { applyMiddleware } = require('graphql-middleware');
const { ApolloServer } = require('apollo-server-express');

const { typeDefs, resolvers } = require('./graphql');
const authMiddleware = require('./middleware/auth-middleware');
const { loaders } = require('./loader');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const executableSchema = makeExecutableSchema({ typeDefs, resolvers });
const protectedSchema = applyMiddleware(executableSchema, authMiddleware);

let server = new ApolloServer({
  schema: protectedSchema,
  debug: process.env.APOLLO_SERVER_DEBUG === 'true',
  playground: process.env.APOLLO_SERVER_PLAYGROUND === 'true',
  introspection: true,
  formatError: (err) => {
    return err;
  },
  formatResponse: (response, requestContext) => {
    if (requestContext.response && requestContext.response.http) {
      requestContext.response.http.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      requestContext.response.http.headers.set('Pragma', 'no-cache');
      requestContext.response.http.headers.set('Expires', '0');
      requestContext.response.http.headers.set('X-Content-Type-Options', 'nosniff');
    }

    return response;
  },
  context: (req) => ({
    req: req.req,
    loaders: loaders(),
  }),
});
const startServer = async () => {
  await server.start();
  server.applyMiddleware({ app });
};
startServer();
module.exports = app;

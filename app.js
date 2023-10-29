'use strict';
require = '../utils/database';

const express = require('express');
const { makeExecutableSchema } = require('graphql-tools');
const { applyMiddleware } = require('graphql-middleware');
const { ApolloServer } = require('apollo-server-express');

const { typeDefs, resolvers } = require('./graphql');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const executableSchema = makeExecutableSchema({ typeDefs, resolvers });
const protectedSchema = applyMiddleware(executableSchema);


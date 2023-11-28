const { gql } = require('apollo-server-express');
const { merge } = require('lodash');

const UserTypes = require('./userTypes');
const User = require('./users');
const Ingredient = require('./ingredients');

const typedef = gql`
  type Query
  type Mutation
`;
const typeDefs = [typedef, UserTypes.typedef, User.typeDefs, Ingredient.typedefs];

let resolvers = {};
resolvers = merge(resolvers, UserTypes.resolvers, User.resolvers, Ingredient.resolvers);

module.exports = {
  typeDefs,
  resolvers,
};

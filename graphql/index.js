const { gql } = require('apollo-server-express');
const { merge } = require('lodash');

const UserTypes = require('./userTypes');
const User = require('./users');
const Ingredient = require('./ingredients');
const Recipe = require('./recipes');

const typedef = gql`
  type Query
  type Mutation
`;
const typeDefs = [typedef, UserTypes.typedef, User.typeDefs, Ingredient.typedefs, Recipe.typedefs];

let resolvers = {};
resolvers = merge(resolvers, UserTypes.resolvers, User.resolvers, Ingredient.resolvers, Recipe.resolvers);

module.exports = {
  typeDefs,
  resolvers,
};

const { gql } = require('apollo-server-express');
const { merge } = require('lodash');

const UserTypes = require('./userTypes');
const User = require('./users')

const typedef = gql`
	type Query
	type Mutation
`;
const typeDefs = [typedef, UserTypes.typedef, User.typeDefs];

let resolvers = {};
resolvers = merge(resolvers, UserTypes.resolvers, User.resolvers);

module.exports = {
	typeDefs,
	resolvers,
};

const { gql } = require('apollo-server-express');
const { merge } = require('lodash');

const UserTypes = require('./userTypes');

const typedef = gql`
	type Query
	type Mutation
`;
const typeDefs = [typedef, UserTypes.typedef];

let resolvers = {};
resolvers = merge(resolvers, UserTypes.resolvers);

module.exports = {
	typeDefs,
	resolvers,
};

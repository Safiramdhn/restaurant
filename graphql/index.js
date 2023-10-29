const { gql } = require('graphql');
const { merge } = require('lodash');

const UserTypes = require('./userTypes');

const typedef = gql`
	type Query
	type Mutation
`;
const typedefs = [typedef, UserTypes.typedef];

let resolvers = {};
resolvers = merge(resolvers, UserTypes.resolvers);

module.exports = {
	typedefs,
	resolvers,
};

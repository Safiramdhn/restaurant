const UserModel = require('./user.model');
const typeDefs = require('./user.typedef');
const resolvers = require('./user.resolvers');

module.exports = {
	UserModel,
	typeDefs,
	resolvers
};

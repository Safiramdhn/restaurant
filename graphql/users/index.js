const UserModel = require('./user.model');
const typeDefs = require('./user.typedef');
const resolvers = require('./user.resolvers');
const UserLoader = require('./user.loader');

module.exports = {
  UserModel,
  typeDefs,
  resolvers,
  UserLoader,
};

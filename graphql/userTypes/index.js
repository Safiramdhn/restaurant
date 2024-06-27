const UserTypeModel = require('./user_type.model');
const typedef = require('./user_type.typedef');
const resolvers = require('./user_type.resolvers');
const userTypeLoader = require('./user_type.loader');
module.exports = {
  UserTypeModel,
  typedef,
  resolvers,
  userTypeLoader,
};

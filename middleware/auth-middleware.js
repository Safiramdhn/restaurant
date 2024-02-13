const { AuthenticationError } = require('apollo-server-express');
const { getUserId } = require('../utils/common');

const UserModel = require('../graphql/users/user.model');

const requireAuthJwt = async (resolver, parent, args, ctx, info) => {
  const auth = ctx.req.get('Authorization');
  if (!auth) throw new AuthenticationError('Authorization header is missing');

  let token = auth.replace('Bearer ', '');
  let userId = getUserId(token);
  const user = await UserModel.findById(userId).lean();

  if (!user) throw new AuthenticationError('Unauthorization');

  ctx.userId = user._id;
  return resolver();
};

let authMiddleware = {
  Query: {
    GetAllUsers: requireAuthJwt,
    GetOneUser: requireAuthJwt,
    GetOneUserType: requireAuthJwt,
    GetAllIngredients: requireAuthJwt,
    GetOneIngredient: requireAuthJwt,
    GetAllRecipes: requireAuthJwt,
    GetOneRecipe: requireAuthJwt,
    GetAllTransactions: requireAuthJwt,
  },
  Mutation: {
    CreateUser: requireAuthJwt,
    UpdateUser: requireAuthJwt,
    DeleteUser: requireAuthJwt,
    AddIngredient: requireAuthJwt,
    UpdateIngredient: requireAuthJwt,
    DeleteIngredient: requireAuthJwt,
    CreateRecipe: requireAuthJwt,
    UpdateRecipe: requireAuthJwt,
    DeleteRecipe: requireAuthJwt,
  },
};

module.exports = authMiddleware;

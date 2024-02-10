const RecipeModel = require('./recipe.model');
const typedefs = require('./recipe.typedef');
const resolvers = require('./recipe.resolvers');
const RecipeLoader = require('./recipe.loader');

module.exports = {
  RecipeModel,
  typedefs,
  resolvers,
  RecipeLoader,
};

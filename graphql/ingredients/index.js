const IngredientModel = require('./ingredient.model');
const typedefs = require('./ingredient.typedef');
const resolvers = require('./ingredient.resolvers');
const IngredientLoader = require('./ingredient.loader');

module.exports = {
  IngredientModel,
  typedefs,
  resolvers,
  IngredientLoader,
};

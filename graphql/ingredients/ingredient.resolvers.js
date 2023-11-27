const IngredientModel = require('./ingredient.model');

//****Query */

const GetAllIngredients = async (parent) => {
  const ingredients = await IngredientModel.find({
    status: 'active',
  }).lean();

  return ingredients;
};

const GetOneIngredient = async (parent, { _id }) => {
  const ingredient = await IngredientModel.findOne({ _id, status: 'active' }).lean();
  return ingredient;
};

module.exports = {
  Query: {
    GetAllIngredients,
    GetOneIngredient,
  },
};

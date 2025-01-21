const DataLoader = require('dataloader');

const IngredientModel = require('./ingredient.model');

const IngredientLoaderData = async (ingredientIds) => {
  let ingredients = await IngredientModel.find({
    _id: { $in: ingredientIds },
  }).lean();

  let ingredientMap = new Map();
  ingredients.forEach((ingredient) => {
    ingredientMap.set(String(ingredient._id), ingredient);
  });

  return ingredientIds.map((id) => ingredientMap.get(id.toString()));
};

exports.IngredientLoader = () => new DataLoader(IngredientLoaderData);

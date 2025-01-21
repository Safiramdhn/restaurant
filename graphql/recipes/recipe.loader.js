const DataLoader = require('dataloader');

const RecipeModel = require('./recipe.model');

const RecipeLoaderData = async (recipeIds) => {
  let recipes = await RecipeModel.find({
    _id: { $in: recipeIds },
  }).lean();

  let recipeMap = new Map();
  recipes.forEach((recipe) => {
    recipeMap.set(String(recipe._id), recipe);
  });

  return recipeIds.map((id) => recipeMap.get(id.toString()));
};

exports.RecipeLoader = () => new DataLoader(RecipeLoaderData);

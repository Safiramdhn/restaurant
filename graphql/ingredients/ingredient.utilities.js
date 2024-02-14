const IngredientModel = require('./ingredient.model');
const RecipeModel = require('../recipes/recipe.model');

const checkIngredientStock = async (menu) => {
  let checkIngredientStock = [];
  let totalAmount;
  if (menu) {
    const recipe = await RecipeModel.findById(recipe).lean();
    if (recipe && recipe.ingredient_details.length) {
      for (const ingredientDetail of recipe.ingredient_details) {
        let ingredient = await IngredientModel.findById(ingredientDetail.ingredient);
        if (ingredient && ingredient.stock_amount) {
          totalAmount = ingredientDetail.stock_used * menu.amount;
          checkIngredientStock.push(ingredient.stock_amount - totalAmount);
        }
      }
      if (checkIngredientStock.length) {
        if (checkIngredientStock.some((v) => v <= 0)) {
          throw new Error('Your request amount is more than available stock');
        } else {
          await updateStockFromTransaction(recipe.ingredient_details, totalAmount, false);
        }
      }
    }
  }
};

const updateStockFromTransaction = async (ingredient_details, amount, is_removed) => {
  for (const ingredientDetail of ingredient_details) {
    let ingredient = await IngredientModel.findById(ingredientDetail.ingredient).lean();
    if (ingredient) {
      await IngredientModel.findByIdAndUpdate(ingredient._id, {
        stock_amount: is_removed ? (ingredient.stock_amount += amount) : (ingredient.stock_amount -= amount),
      });
    }
  }
};

module.exports = {
  checkIngredientStock,
  updateStockFromTransaction,
};

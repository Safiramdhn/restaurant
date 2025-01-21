const IngredientModel = require('./ingredient.model');
const RecipeModel = require('../recipes/recipe.model');

/**
 * To validate ingredient stock is still available to add requested menu to transaction
 *
 * @param {array of object} menu contain recipe id and requested amount
 */
const checkIngredientStock = async (menu) => {
  let checkIngredientStock = [];
  
  if (menu) {
    const recipe = await RecipeModel.findById(menu.recipe).lean();
    if (recipe && recipe.ingredient_details.length) {
      for (const ingredientDetail of recipe.ingredient_details) {
        let ingredient = await IngredientModel.findById(ingredientDetail.ingredient);
        //calculate the current ingredient stock with requested menu amount and used amount in recipe
        if (ingredient && ingredient.stock_amount) {
            let totalAmount = ingredientDetail.stock_used * menu.amount;
          checkIngredientStock.push(ingredient.stock_amount - totalAmount);
        }
      }
    }

    if (checkIngredientStock.length) {
      // if the recipe ingredient 0 is less and equal than 0 must stop process
        if (checkIngredientStock.some((v) => v <= 0)) {
          throw new Error('Your request amount is more than available stock');
        } else {
          await updateStockFromTransaction(recipe.ingredient_details, menu.amount, false);
        }
      }
  }
};

/**
 * To update ingredient amount stock from transaction is increased or decreased
 *
 * @param {array of object} ingredient_details contain ingredient id and ingredient stock used amount
 * @param {number} amount requested menu amount
 * @param {boolean} is_removed decision param to increase or decrease ingredient stock amount
 */
const updateStockFromTransaction = async (ingredient_details, amount, is_removed) => {
  if (ingredient_details && ingredient_details.length) {
    for (const ingredientDetail of ingredient_details) {
      let totalAmount = ingredientDetail.stock_used * amount;
      let ingredient = await IngredientModel.findById(ingredientDetail.ingredient).lean();
      if (ingredient) {
        await IngredientModel.findByIdAndUpdate(ingredient._id, {
          stock_amount: is_removed ? (ingredient.stock_amount += totalAmount) : (ingredient.stock_amount -= totalAmount),
        });
      }
    }
  }
};

module.exports = {
  checkIngredientStock,
  updateStockFromTransaction,
};

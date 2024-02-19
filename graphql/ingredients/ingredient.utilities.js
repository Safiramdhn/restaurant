const IngredientModel = require('./ingredient.model');
const RecipeModel = require('../recipes/recipe.model');

const checkIngredientStock = async (menu) => {
  let checkIngredientStock = [];
  
  if (menu) {
    const recipe = await RecipeModel.findById(menu.recipe).lean();
    if (recipe && recipe.ingredient_details.length) {
      for (const ingredientDetail of recipe.ingredient_details) {
        let ingredient = await IngredientModel.findById(ingredientDetail.ingredient);
        if (ingredient && ingredient.stock_amount) {
            let totalAmount = ingredientDetail.stock_used * menu.amount;
          checkIngredientStock.push(ingredient.stock_amount - totalAmount);
        }
      }
    }

    if(menu.additional_ingredients && menu.additional_ingredients.length) {
        for (const addtionalIngredientId of menu.additional_ingredients) {
            const additionalIngredient = await IngredientModel.findById(addtionalIngredientId);
            if (additionalIngredient && additionalIngredient.stock_amount) {
                checkIngredientStock.push(additionalIngredient.stock_amount - menu.amount);
            }
        }
    }

    if (checkIngredientStock.length) {
        if (checkIngredientStock.some((v) => v <= 0)) {
          throw new Error('Your request amount is more than available stock');
        } else {
          await updateStockFromTransaction(recipe.ingredient_details, menu.additional_ingredients, menu.amount, false);
        }
      }
  }
};

const updateStockFromTransaction = async (ingredient_details, additional_ingredients, amount, is_removed) => {
  if(ingredient_details && ingredient_details.length) {
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

  if (additional_ingredients && additional_ingredients.length) {
    for (const addtionalIngredientId of additional_ingredients) {
      let additionalIngredient = await IngredientModel.findById(addtionalIngredientId).lean();
      if (additionalIngredient) {
        await IngredientModel.findByIdAndUpdate(additionalIngredient._id, {
          stock_amount: is_removed ? (additionalIngredient.stock_amount += amount) : (additionalIngredient.stock_amount -= amount),
        });
      }
    }
  }
};

module.exports = {
  checkIngredientStock,
  updateStockFromTransaction,
};

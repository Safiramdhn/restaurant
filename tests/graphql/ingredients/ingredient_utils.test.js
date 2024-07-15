/* eslint-disable no-undef */
const IngredientModel = require('../../../graphql/ingredients/ingredient.model');
const RecipeModel = require('../../../graphql/recipes/recipe.model');
const ingredientUtils = require('../../../graphql/ingredients/ingredient.utilities');
const ingredientTestData = require('./ingredient_test_data');

jest.mock('../../../graphql/ingredients/ingredient.utilities', () => ({
//   checkIngredientStock: jest.fn(),
  updateStockFromTransaction: jest.fn(),
}));

describe('checkIngredientStock utils', () => {
  let mockRecipeModelFindById;
  let mockIngredientModelFindById;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock database models
    mockRecipeModelFindById = jest.spyOn(RecipeModel, 'findById');
    mockIngredientModelFindById = jest.spyOn(IngredientModel, 'findById');
  });

  it('Should call updateStockFromTransaction utils one time if check result is more than 0', async () => {
    const { recipe, ingredients } = ingredientTestData;
    const menu = {
      recipe: recipe._id,
      amount: 1,
    };

    const mockRecipeFindByIdImpl = () => ({
      lean: jest.fn().mockResolvedValue(recipe),
    });

    const mockIngredientFindByIdImpl = (id) => {
      const ingredient = ingredients.find((ing) => ing._id.toString() === id.toString());
      return {
        lean: jest.fn().mockResolvedValue(ingredient),
      };
    };

    mockRecipeModelFindById.mockImplementation(mockRecipeFindByIdImpl);
    mockIngredientModelFindById.mockImplementation(mockIngredientFindByIdImpl);

    await ingredientUtils.checkIngredientStock(menu);

    expect(mockRecipeModelFindById).toHaveBeenCalledTimes(1);
    expect(mockIngredientModelFindById).toHaveBeenCalledTimes(3);
    expect(ingredientUtils.updateStockFromTransaction).toHaveBeenCalledTimes(1);
    expect(ingredientUtils.updateStockFromTransaction).toHaveBeenCalledWith(recipe.ingredient_details, menu.amount, false);
  });
});

const { UserTypeLoader } = require('../graphql/userTypes/user_type.loader');
const { UserLoader } = require('../graphql/users/user.loader');
const { IngredientLoader } = require('../graphql/ingredients/ingredient.loader');
const { RecipeLoader } = require('../graphql/recipes/recipe.loader');

module.exports = {
  loaders: () => {
    return {
      UserTypeLoader: UserTypeLoader(),
      UserLoader: UserLoader(),
      IngredientLoader: IngredientLoader(),
      RecipeLoader: RecipeLoader(),
    };
  },
};

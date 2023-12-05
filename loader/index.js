const { UserTypeLoader } = require('../graphql/userTypes/user_type.loader');
const { UserLoader } = require('../graphql/users/user.loader');
const {IngredientLoader} = require('../graphql/ingredients/ingredient.loader');

module.exports = {
  loaders: () => {
    return {
      UserTypeLoader: UserTypeLoader(),
      UserLoader: UserLoader(),
      IngredientLoader: IngredientLoader(),
    };
  },
};

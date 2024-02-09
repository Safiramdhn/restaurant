const RecipeModel = require('./recipe.model');
const UserModel = require('../users/user.model');
const UserTypeModel = require('../userTypes/user_type.model');
const IngredientModel = require('../ingredients/ingredient.model');

const _ = require('lodash');

//****Query */
const GetAllRecipes = async (parent, { filter, sorting, pagination }) => {
  let aggregateQuery = [];
  let queryFilter = {
    $and: [{ status: 'active' }],
  };
  let sort = {};

  // **** Find recipe using filter
  if (filter) {
    if (filter.name) {
      queryFilter.$and.push({ name: { $regex: filter.name, $options: 'i' } });
    }

    if (filter.publish_status) {
      queryFilter.$and.push({ is_published: filter.publish_status.toLowerCase() === 'yes' ? true : false });
    }

    if (filter.discount_status) {
      queryFilter.$and.push({ is_discount: filter.discount_status.toLowerCase() === 'yes' ? true : false });
    }

    if (filter.best_seller) {
      queryFilter.$and.push({ is_best_seller: filter.best_seller.toLowerCase() === 'yes' ? true : false });
    }
  }

  // **** sort data
  if (sorting) {
    if (sorting.name) {
      sort = { ...sort, name: sorting.name === 'asc' ? 1 : -1 };
    } else if (sorting.price) {
      sort = { ...sort, price: sorting.price === 'asc' ? 1 : -1 };
    } else if (sorting.discount_amount) {
      sort = { ...sort, discount: sorting.discount_amount === 'asc' ? 1 : -1 };
    }
  }

  aggregateQuery.push(
    {
      $match: queryFilter,
    },
    {
      $sort: sort && !_.isEmpty(sort) ? sort : { createdAt: -1 },
    }
  );

  // use $facet if use pagination
  if (pagination) {
    aggregateQuery.push({
      $facet: {
        data: [{ $skip: pagination.limit * pagination.page }, { $limit: pagination.limit }],
        countData: [{ $group: { _id: null, count: { $sum: 1 } } }],
      },
    });
    let recipes = await RecipeModel.aggregate(aggregateQuery).allowDiskUse(true);
    return recipes[0].data.map((recipe) => {
      return {
        ...recipe,
        count_document: recipes[0].countData[0].count,
      };
    });
  } else {
    let recipes = await RecipeModel.aggregate(aggregateQuery).allowDiskUse(true);
    return recipes.map((recipe) => {
      return {
        ...recipe,
      };
    });
  }
};

const GetOneRecipe = async (parent, { _id }) => {
  const recipe = await RecipeModel.findById(_id).lean();
  return recipe;
};

// **** Mutation */
const CreateRecipe = async (parent, { recipe_input }, ctx) => {
  // check user permission
  const userLogin = await UserModel.findById(ctx.userId)
    .populate([{ path: 'user_type', select: 'name' }])
    .lean();
  if (userLogin && userLogin.user_type && userLogin.user_type.name !== 'General Admin' && userLogin.user_type.name !== 'Stock Admin')
    throw new Error('Only General Admin or Stock Admin can add new recipe');

  // recipe name is mandatory
  if (!recipe_input.name) {
    throw new Error('Recipe must has a name');
  } else {
    // check existed active recipe with same name
    const existedRecipe = await RecipeModel.findOne({
      status: 'active',
      name: recipe_input.name,
    }).lean();
    if (existedRecipe) throw new Error(`Recipe's name already exists`);
  }

  const recipe = await RecipeModel.create(recipe_input);
  return recipe;
};

// loader
const available = async (parent, args, ctx) => {
  let result;
  if (parent.ingredient_details.length) {
    let minStock = [];
    for (let recipeIngredient of parent.ingredient_details) {
      const ingredient = await IngredientModel.findById(recipeIngredient.ingredient).lean();
      minStock.push(Math.floor(ingredient.stock_amount / recipeIngredient.stock_used));
    }
    if (minStock.some((v) => v <= 0)) {
      result = 0;
      return 0;
    } else {
      result = Math.min(...minStock);
    }
  } else {
    result = 0;
  }
  return result;
};

module.exports = {
  Query: {
    GetAllRecipes,
    GetOneRecipe,
  },
  Mutation: {
    CreateRecipe,
  },
  Recipe: {
    available,
  },
};

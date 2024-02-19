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
        price:  recipe.is_discount ? recipe.price - (recipe.price * recipe.discount/100)  : recipe.price,
        count_document: recipes[0].countData[0].count,
      };
    });
  } else {
    let recipes = await RecipeModel.aggregate(aggregateQuery).allowDiskUse(true);
    return recipes.map((recipe) => {
      return {
        ...recipe,
        price:  recipe.is_discount ? recipe.price - (recipe.price * recipe.discount/100)  : recipe.price,
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

const UpdateRecipe = async (parent, { _id, recipe_input, publish_status }, ctx) => {
  const oldRecipe = await RecipeModel.findById(_id);
  // check recipe publish status
  if (oldRecipe && oldRecipe.is_published && [null, undefined].includes(publish_status)) throw new Error('The recipe is already published');

  const userLogin = await UserModel.findById(ctx.userId)
    .populate([{ path: 'user_type', select: 'name' }])
    .lean();
  if (userLogin && userLogin.user_type && userLogin.user_type.name !== 'General Admin' && userLogin.user_type.name !== 'Stock Admin')
    throw new Error('Only General Admin or Stock Admin can update recipe');

  if (recipe_input) {
    // check existed recipe with same name
    if (recipe_input.name && oldRecipe && [null, undefined, ''].includes(recipe_input.name) && recipe_input.name.toLowerCase() !== oldRecipe.name.toLowerCase()) {
      const existedRecipe = await RecipeModel.findOne({
        _id: {
          $ne: _id,
        },
        name: recipe_input.name,
        status: 'active',
      }).lean();
      if (existedRecipe) throw new Error(`This recipe's name already exists`);
    }

    // discount validation if any update on discount status
    if (recipe_input.is_discount === true && (!recipe_input.discount || recipe_input.discount <= 0)) {
      throw new Error('Discount value should be greater than zero');
    } else if (recipe_input.is_discount === false) {
      recipe_input.discount = 0;
    }

    await RecipeModel.findByIdAndUpdate(_id, { $set: recipe_input });
  }
  //  set publish status
  if (![null, undefined].includes(publish_status) && publish_status !== oldRecipe.is_published) {
    await RecipeModel.findByIdAndUpdate(_id, { $set: { is_published: publish_status } });
  }

  const updatedRecipe = await RecipeModel.findById(_id);
  return updatedRecipe;
};

const DeleteRecipe = async (parent, { _id }, ctx) => {
  const recipe = await RecipeModel.findById(_id).lean();
  if (recipe) {
    // check is recipe is published or not
    if (recipe.is_published) throw new Error('The recipe is already published');

    // check user permission
    const userLogin = await UserModel.findById(ctx.userId)
      .populate([{ path: 'user_type', select: 'name' }])
      .lean();
    if (userLogin && userLogin.user_type && userLogin.user_type.name !== 'General Admin' && userLogin.user_type.name !== 'Stock Admin')
      throw new Error('Only General Admin or Stock Admin can update recipe');

    // mark recipe as deleted
    await RecipeModel.findByIdAndUpdate(_id, { status: 'deleted' }).lean();
    return `Recipe ${recipe.name} is deleted`;
  }
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

const ingredient = async (parent, args, ctx) => {
  if (parent.ingredient) {
    const result = await ctx.loaders.IngredientLoader.load(parent.ingredient);
    return result;
  }
};

module.exports = {
  Query: {
    GetAllRecipes,
    GetOneRecipe,
  },
  Mutation: {
    CreateRecipe,
    UpdateRecipe,
    DeleteRecipe,
  },
  Recipe: {
    available,
  },
  IngredientDetail: {
    ingredient,
  },
};

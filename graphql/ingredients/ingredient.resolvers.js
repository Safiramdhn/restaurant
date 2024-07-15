const IngredientModel = require('./ingredient.model');
const UserModel = require('../users/user.model');
const UserTypesModel = require('../userTypes/user_type.model');
const RecipeModel = require('../recipes/recipe.model');

const moment = require('moment');
const _ = require('lodash');

//****Query */

const GetAllIngredients = async (parent, { filter, pagination, sorting }) => {
  let aggregateQuery = [];
  let queryFilter = {
    $and: [{ status: 'active' }],
  };
  let sort = {};

  // **** Find ingredient using filter
  if (filter) {
    if (filter.name) {
      queryFilter.$and.push({ name: { $regex: filter.name, $options: 'i' } });
    }

    if (filter.is_available) {
      queryFilter.$and.push({ is_available: filter.is_available.toLowerCase() === 'yes' ? true : false });
    }
  }

  // ****  Sort the data
  if (sorting) {
    if (sorting.name) {
      sort = { ...sort, name: sorting.name === 'asc' ? 1 : -1 };
    } else if (sorting.stock) {
      sort = { ...sort, stock_amount: sorting.stock === 'asc' ? 1 : -1 };
    }
  }

  aggregateQuery.push({
    $match: queryFilter,
  }, {
    $sort: sort && !_.isEmpty(sort) ? sort : {createAt: -1},
  });

  // use $facet if use pagination
  if (pagination) {
    aggregateQuery.push({
      $facet: {
        data: [{ $skip: pagination.limit * pagination.page }, { $limit: pagination.limit }],
        countData: [{ $group: { _id: null, count: { $sum: 1 } } }],
      },
    });
    let ingredients = await IngredientModel.aggregate(aggregateQuery);
    return ingredients[0].data.map((ingredient) => {
      return {
        ...ingredient,
        count_document: ingredients[0].countData[0].count,
      };
    });
  } else {
    let ingredients = await IngredientModel.aggregate(aggregateQuery);
    return ingredients.map((ingredient) => {
      return {
        ...ingredient,
      };
    });
  }
};

const GetOneIngredient = async (parent, { _id }) => {
  const ingredient = await IngredientModel.findOne({ _id, status: 'active' }).lean();
  return ingredient;
};

//****Mutation */
const AddIngredient = async (parent, { ingredient_input }, ctx) => {
  // check user permission
  const userLogin = await UserModel.findById(ctx.userId)
    .populate([{ path: 'user_type', select: 'name' }])
    .lean();
  if (userLogin && userLogin.user_type && userLogin.user_type.name !== 'General Admin' && userLogin.user_type.name !== 'Stock Admin')
    throw new Error('Only General Admin or Stock Admin can add new ingredient');

  // ingredient name is mandatory
  if (!ingredient_input.name) {
    throw new Error('Ingredient must has a name');
  } else {
    // check existed active ingredient with same name
    const existedIngredient = await IngredientModel.findOne({
      name: ingredient_input.name,
      status: 'active',
    }).lean();
    if (existedIngredient) throw new Error(`Ingredient's name already existed`);
  }

  // update ingredient availablity when stock amount more than 0
  if (ingredient_input.stock_amount > 0) {
    ingredient_input.is_available = true;
  }

  const ingredient = await IngredientModel.create(ingredient_input);
  return ingredient;
};

const UpdateIngredient = async (parent, { _id, ingredient_input }, ctx) => {
  // check user permission
  const userLogin = await UserModel.findById(ctx.userId)
    .populate([{ path: 'user_type', select: 'name' }])
    .lean();
  if (userLogin && userLogin.user_type && userLogin.user_type.name !== 'General Admin' && userLogin.user_type.name !== 'Stock Admin')
    throw new Error('Only General Admin or Stock Admin can add new ingredient');

  const oldIngredientData = await IngredientModel.findById(_id).lean();

  if (ingredient_input.name && ingredient_input.name !== oldIngredientData.name) {
    // check existed active ingredient with different id
    const existedIngredient = await IngredientModel.findOne({
      name: ingredient_input.name,
      status: 'active',
      _id: {
        $ne: _id,
      },
    }).lean();
    if (existedIngredient) throw new Error(`This ingredient's name already exists`);
  }

  // update ingredient availablity when stock amount more than 0
  if (ingredient_input.stock_amount > 0 && !oldIngredientData.is_available) {
    ingredient_input.is_available = true;
  } else if (ingredient_input.stock_amount === 0 &&  oldIngredientData.is_available) {
    ingredient_input.is_available = false;
  }

  const updateIngredient = await IngredientModel.findByIdAndUpdate(
    _id,
    {
      $set: ingredient_input,
      $push: {
        update_histories: {
          date: moment().format('DD/MM/YYYY'),
          user: userLogin._id,
        },
      },
    },
    { new: true }
  );
  return updateIngredient;
};

const DeleteIngredient = async (parent, { _id }, ctx) => {
  // check user permission
  const userLogin = await UserModel.findById(ctx.userId)
    .populate([{ path: 'user_type', select: 'name' }])
    .lean();
  if (userLogin && userLogin.user_type && userLogin.user_type.name !== 'General Admin' && userLogin.user_type.name !== 'Stock Admin')
    throw new Error('Only General Admin or Stock Admin can add new ingredient');

  const ingredient = await IngredientModel.findById(_id).lean();
  // if ingredient was used in published recipes then don't delete it
  const checkInRecipes = await RecipeModel.find({
    is_published: true,
    ingredient_details: {
      $elemMatch: {
        ingredient: ingredient._id
      }
    }
  }).lean();
  if(checkInRecipes && checkInRecipes.length) throw new Error(`Ingredient ${ingredient.name} is used in published recipe`)

  await IngredientModel.findByIdAndUpdate(_id, {
    $set: {
      status: 'deleted',
    },
  }).lean();

  return `Ingredient ${ingredient.name} is deleted`;
};

module.exports = {
  Query: {
    GetAllIngredients,
    GetOneIngredient,
  },
  Mutation: {
    AddIngredient,
    UpdateIngredient,
    DeleteIngredient,
  },
};

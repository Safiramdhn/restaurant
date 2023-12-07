const IngredientModel = require('./ingredient.model');
const UserModel = require('../users/user.model');
const UserTypes = require('../userTypes/user_type.model');

const moment = require('moment');
const _ = require('lodash');

//****Query */

const GetAllIngredients = async (parent, { filter, pagination, sorting }) => {
  let aggregateQuery = [];
  let queryFilter = {
    $and: [{ status: 'active' }],
  };
  let sort = {};

  if (filter) {
    if (filter.name) {
      queryFilter.$and.push({ name: { $regex: filter.name, $options: 'i' } });
    }

    if (filter.is_available) {
      queryFilter.$and.push({ is_available: filter.is_available });
    }

    if (filter.is_additional_ingredient) {
      queryFilter.$and.push({ is_additional_ingredient: filter.is_additional_ingredient });
    }
  }

  if (sorting) {
    if (sorting.name) {
      sort = { ...sort, name: sorting.name === 'asc' ? 1 : -1 };
    } else if (sorting.stock) {
      sort = { ...sort, stock_amount: sorting.stock === 'asc' ? 1 : -1 };
    } else if (sorting.available) {
      sort = { ...sort, is_available: sorting.available === 'asc' ? 1 : -1 };
    } else if (sorting.additional) {
      sort = { ...sort, is_additional_ingredient: sorting.additional === 'asc' ? 1 : -1 };
    }
  }

  aggregateQuery.push({
    $match: queryFilter,
  }, {
    $sort: sort && !_.isEmpty(sort) ? sort : {createAt: -1},
  });

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
  const userLogin = await UserModel.findById(ctx.userId)
    .populate([{ path: 'user_type', select: 'name' }])
    .lean();
  if (userLogin && userLogin.user_type && userLogin.user_type.name !== 'Stock Admin') throw new Error('Only Stock Admin can add new ingredient');

  if (!ingredient_input.name) {
    throw new Error('Ingredient must have a name');
  } else {
    // check existed active ingredient
    const existedIngredient = await IngredientModel.findOne({
      name: ingredient_input.name,
      status: 'active',
    }).lean();
    if (existedIngredient) throw new Error('Ingredient name already existed');
  }

  const ingredient = await IngredientModel.create(ingredient_input);
  return ingredient;
};

const UpdateIngredient = async (parent, { _id, ingredient_input }, ctx) => {
  const userLogin = await UserModel.findById(ctx.userId)
    .populate([{ path: 'user_type', select: 'name' }])
    .lean();
  if (userLogin && userLogin.user_type && userLogin.user_type.name !== 'Stock Admin') throw new Error('Only Stock Admin can edit the ingredient');

  const oldIngredientData = await IngredientModel.findById(_id).lean();
  if (ingredient_input.name && ingredient_input.name !== oldIngredientData.name) {
    // check existed active ingredient
    const existedIngredient = await IngredientModel.find({
      name: ingredient_input.name,
      status: 'active',
    }).lean();
    if (existedIngredient) throw new Error('Ingredient name already existed');
  }

  if (ingredient_input.stock_amount) {
    ingredient_input.stock_amount += oldIngredientData.stock_amount;
  }

  const updateIngredient = await IngredientModel.findByIdAndUpdate(
    _id,
    {
      $set: ingredient_input,
      $addToSet: {
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
  const userLogin = await UserModel.findById(ctx.userId)
    .populate([{ path: 'user_type', select: 'name' }])
    .lean();
  if (userLogin && userLogin.user_type && userLogin.user_type.name !== 'Stock Admin') throw new Error('Only Stock Admin can delete the ingredient');

  // if ingredient was used in published recipes then don't delete it

  const ingredient = await IngredientModel.findByIdAndUpdate(_id, {
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

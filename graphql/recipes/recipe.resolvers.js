const RecipeModel = require('./recipe.model');

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
    let recipes = await RecipeModel.aggregate(aggregateQuery).allowDiskUse(true).lean();
    return recipes[0].data.map((recipe) => {
      return {
        ...recipe,
        count_document: recipes[0].countData[0].count,
      };
    });
  } else {
    let recipes = await RecipeModel.aggregate(aggregateQuery).allowDiskUse(true).lean();
    return recipes[0].data.map((recipe) => {
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

module.exports = {
  Query: {
    GetAllRecipes,
    GetOneRecipe,
  },
};

const TransactionModel = require('./transaction.model');
const UserModel = require('../users/user.model');
const RecipeModel = require('../recipes/recipe.model');

const IngredientUtils = require('../ingredients/ingredient.utilities');

const moment = require('moment');
const _ = require('lodash');

// Query
const GetAllTransactions = async (parent, { filter, sorting, pagination }) => {
  let aggregateQuery = [];
  let queryFilter = {
    $and: [
      {
        status: 'active',
      },
    ],
  };
  let sort = {};

  if (filter) {
    if (filter.transaction_date) {
      let today = moment.utc();
      if (filter.transaction_date === 'today') {
        queryFilter.$and.push({
          createdAt: {
            $gte: today.hour(0).minute(0).second(0).toDate(),
            $lte: today.hour(23).minute(59).second(59).toDate(),
          },
        });
      } else if (filter.transaction_date === 'yesterday') {
        queryFilter.$and.push({
          createdAt: {
            $gte: today.subtract(1, 'd').hour(0).minute(0).second(0).toDate(),
            $lte: today.subtract(1, 'd').hour(23).minute(59).second(59).toDate(),
          },
        });
      } else if (filter.transaction_date === 'last_week') {
        queryFilter.$and.push({
          createdAt: {
            $gte: today.subtract(7, 'd').hour(0).minute(0).second(0).toDate(),
            $lte: today.subtract(7, 'd').hour(23).minute(59).second(59).toDate(),
          },
        });
      } else if (filter.transaction_date === 'last_month') {
        queryFilter.$and.push({
          createdAt: {
            $gte: today.subtract(30, 'd').hour(0).minute(0).second(0).toDate(),
            $lte: today.subtract(30, 'd').hour(23).minute(59).second(59).toDate(),
          },
        });
      }
    }

    if (filter.cashier) {
      aggregateQuery.push(
        {
          $lookup: {
            from: 'users',
            localField: 'cashier',
            foreignField: '_id',
            as: 'cashier_populated',
          },
        },
        {
          $addField: {
            cashier_fullname: {
              $concat: [
                { $toLower: { $trim: { input: { $arrayElemAt: ['$cashier_populated.first_name', 0] } } } },
                ' ',
                { $toLower: { $trim: { input: { $arrayElemAt: ['$cashier_populated.last_name', 0] } } } },
              ],
            },
          },
        }
      );

      queryFilter.$and.push({
        cashier_fullname: { $regex: filter.cashier.toLowerCase(), $options: 'i' },
      });
    }

    if (filter.payment_method) {
      queryFilter.$and.push({
        payment_method: filter.payment_method,
      });
    }

    if (filter.transaction_status) {
      queryFilter.$and.push({
        transaction_status: filter.transaction_status,
      });
    }
  }

  if (sorting) {
    if (sorting.transaction_date) {
      sort = { ...sort, createdAt: sorting.transaction_date === 'asc' ? 1 : -1 };
    } else if (sorting.total_price) {
      sort = { ...sort, total_price: sorting.total_price === 'asc' ? 1 : -1 };
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

  if (pagination) {
    aggregateQuery.push({
      $facet: {
        data: [{ $skip: pagination.limit * pagination.page }, { $limit: pagination.limit }],
        countData: [{ $group: { _id: null, count: { $sum: 1 } } }],
      },
    });
    let transactions = await TransactionModel.aggregate(aggregateQuery).allowDiskUse(true);
    return transactions[0].data.map((transaction) => {
      return {
        ...transaction,
        count_document: transaction[0].countData[0].count,
      };
    });
  } else {
    let transactions = await TransactionModel.aggregate(aggregateQuery).allowDiskUse(true);
    return transactions.map((transaction) => {
      return {
        ...transaction,
      };
    });
  }
};

const GetOneTransaction = async (parent, { _id }) => {
  const transaction = await TransactionModel.findById(_id);
  return transaction;
};

//  Mutation
const CreateTransaction = async (parent, { transaction_input }, ctx) => {
  const userLogin = await UserModel.findById(ctx.userId)
    .populate([{ path: 'user_type', select: 'name' }])
    .lean();
  if (userLogin && userLogin.user_type && userLogin.user_type.name !== 'Restaurant Admin')
    throw new Error('Only Restaurant Admin can create transaction');

  if (transaction_input) {
    if (transaction_input.menus.length) {
      transaction_input.total_price = 0;
      for (let menu of transaction_input.menus) {
        if (menu.amount < 1) {
          throw new Error('Please fill amount of selected menu');
        }

        //call function checkIngredientStock
        await IngredientUtils.checkIngredientStock(menu)

        const recipe = await RecipeModel.findById(menu.recipe).lean();
        transaction_input.total_price += (recipe.price - (recipe.price * recipe.discount ? recipe.discount / 100 : 0)) * menu.amount;
      }
    }

    const todayTransaction = await TransactionModel.find({
      createdAt: {
        $gte: moment.utc().hour(0).minute(0).second(0),
        $lte: moment.utc().hour(23).minute(59).second(59),
      },
    });

    if (todayTransaction.length) {
      transaction_input.queue_number = todayTransaction.length + 1;
    } else {
      transaction_input.queue_number = 1;
    }

    const transaction = await TransactionModel.create(transaction_input);
    return transaction;
  }
};

module.exports = {
  Query: {
    GetAllTransactions,
    GetOneTransaction,
  },
  Mutation: {
    CreateTransaction,
  },
};

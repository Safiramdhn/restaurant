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
  // check user permission
  const userLogin = await UserModel.findById(ctx.userId)
    .populate([{ path: 'user_type', select: 'name' }])
    .lean();
  if (userLogin && userLogin.user_type && userLogin.user_type.name !== 'Restaurant Admin')
    throw new Error('Only Restaurant Admin can create transaction');

  if (transaction_input) {
    if (transaction_input.menus.length) {
      transaction_input.total_price = 0;
      for (let menu of transaction_input.menus) {
        // check requested amount
        if (menu.amount < 1) {
          throw new Error('Please fill amount of selected menu');
        }

        //call function checkIngredientStock
        await IngredientUtils.checkIngredientStock(menu);

        const recipe = await RecipeModel.findById(menu.recipe).lean();
        const priceAfterDiscount = parseInt(recipe.is_discount ? recipe.price * (recipe.discount / 100) : 0);
        transaction_input.total_price += parseInt((recipe.price - priceAfterDiscount) * menu.amount);
      }
    }

    // get queue number based on number of transactions today
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

const UpdateTransaction = async (parent, { _id, transaction_input }, ctx) => {
  // check user permission
  const userLogin = await UserModel.findById(ctx.userId)
    .populate([{ path: 'user_type', select: 'name' }])
    .lean();
  // get existed transaction
  const oldTransaction = await TransactionModel.findById(_id).lean();

  if (userLogin && oldTransaction) {
    // Restaurant Admin can update menu detail and update transaction status to "pending"
    if (userLogin.user_type && userLogin.user_type.name === 'Restaurant Admin') {
      if (transaction_input.transaction_status === 'paid') {
        throw new Error('Restaurant Admin cannot change transaction status to paid');
      }
      if (transaction_input.menus) {
        transaction_input.total_price = parseInt(oldTransaction.total_price);
        if (transaction_input.menus.length === oldTransaction.menus.length) {
          for (const menu of transaction_input.menus) {
            for (const oldMenu of oldTransaction.menus) {
              if (String(menu._id) === String(oldMenu._id) && menu.amount !== oldMenu.amount) {
                let copyMenu = _.cloneDeep(menu);

                if (copyMenu.amount > oldMenu.amount) {
                  copyMenu.amount = copyMenu.amount - oldMenu.amount;
                  await IngredientUtils.checkIngredientStock(copyMenu);

                  const recipe = await RecipeModel.findById(copyMenu.recipe).lean();
                  const priceAfterDiscount = parseInt(recipe.is_discount ? recipe.price * (recipe.discount / 100) : 0);
                  transaction_input.total_price += parseInt((recipe.price - priceAfterDiscount) * copyMenu.amount);
                } else if (copyMenu.amount < oldMenu.amount) {
                  copyMenu.amount = oldMenu.amount - copyMenu.amount;
                  const recipe = await RecipeModel.findById(copyMenu.recipe).lean();
                  await IngredientUtils.updateStockFromTransaction(recipe.ingredient_details, copyMenu.amount, true);

                  const priceAfterDiscount = parseInt(recipe.is_discount ? recipe.price * (recipe.discount / 100) : 0);
                  transaction_input.total_price -= parseInt((recipe.price - priceAfterDiscount) * copyMenu.amount);
                }
              } else {
                continue;
              }
            }
          }
        } else if (transaction_input.menus.length > oldTransaction.menus.length) {
          for (const menu of transaction_input.menus) {
            if (!menu._id) {
              await IngredientUtils.checkIngredientStock(menu);
              const recipe = await RecipeModel.findById(menu.recipe).lean();
              const priceAfterDiscount = parseInt(recipe.is_discount ? recipe.price * (recipe.discount / 100) : 0);
              transaction_input.total_price += parseInt((recipe.price - priceAfterDiscount) * menu.amount);
            }
          }
        } else if (transaction_input.menus.length < oldTransaction.menus.length) {
          if (transaction_input.menus.length) {
            for (const menu of transaction_input.menus) {
              for (const oldMenu of oldTransaction.menus) {
                if (oldMenu._id.toString() !== menu._id.toString()) {
                  const recipe = await RecipeModel.findById(oldMenu.recipe).lean();
                  await IngredientUtils.updateStockFromTransaction(recipe.ingredient_details, oldMenu.amount, true);
                  const priceAfterDiscount = parseInt(recipe.is_discount ? recipe.price * (recipe.discount / 100) : 0);
                  transaction_input.total_price -= parseInt((recipe.price - priceAfterDiscount) * oldMenu.amount);
                }
              }
            }
          } else {
            for (const oldMenu of oldTransaction.menus) {
              const recipe = await RecipeModel.findById(oldMenu.recipe).lean();
              await IngredientUtils.updateStockFromTransaction(recipe.ingredient_details, oldMenu.amount, true);
              const priceAfterDiscount = parseInt(recipe.is_discount ? recipe.price * (recipe.discount / 100) : 0);
              transaction_input.total_price -= parseInt((recipe.price - priceAfterDiscount) * oldMenu.amount);
            }
          }
        }
      }
      // update transaction detail

      await TransactionModel.findByIdAndUpdate(_id, { $set: transaction_input });
    }
    // Cashier can update payment method and update transaction status to "paid"
    else if (userLogin.user_type && userLogin.user_type.name === 'Cashier') {
      if ([null, undefined, ''].includes(transaction_input.payment_method)) {
        throw new Error('Please input the payment method');
      }

      if (transaction_input.transaction_status !== 'paid') {
        throw new Error('Cashier only can change transaction status to paid');
      }

      await TransactionModel.findByIdAndUpdate(_id, {
        $set: {
          ...transaction_input,
          cashier: userLogin._id,
        },
      });
    } else {
      throw new Error('Only Restaurant Admin and Cashier can update transaction');
    }

    //set return message
    const transaction = await TransactionModel.findById(_id).lean();
    if (transaction.transaction_status === 'in_cart') {
      return 'The cart is updated';
    } else if (transaction.transaction_status === 'pending') {
      return `Checkout is success, your queue number is ${transaction.queue_number}`;
    } else if (transaction.transaction_status === 'paid') {
      return 'The transaction is successful';
    }
  }
};

const DeleteTransaction = async (parent, { _id }, ctx) => {
  // check user permission
  const userLogin = await UserModel.findById(ctx.userId)
    .populate([{ path: 'user_type', select: 'name' }])
    .lean();

  if (userLogin && userLogin.user_type && userLogin.user_type.name !== 'Restaurant Admin' && userLogin.user_type.name !== 'Cashier')
    throw new Error('Only Restaurant Admin or Cashier can delete transaction');

  const transaction = await TransactionModel.findById(_id);
  // update ingredient stock if transaction status is not paid yet
  if (transaction.transaction_status !== 'paid' && transaction.menus.length) {
    for (const menu of transaction.menus) {
      const recipe = await RecipeModel.findById(menu.recipe).lean();
      await IngredientUtils.updateStockFromTransaction(recipe.ingredient_details, menu.amount, true);
    }
  }

  await TransactionModel.findByIdAndUpdate(_id, { $set: { status: 'deleted' } });
  return 'Transaction is deleted';
};

// Loader
const recipe = async (parent, args, ctx) => {
  if (parent.recipe) {
    const result = await ctx.loaders.RecipeLoader.load(parent.recipe);
    return result;
  }
};

const cashier = async (parent, args, ctx) => {
  if (parent.cashier) {
    const result = await ctx.loaders.UserLoader.load(parent.cashier);
    return result;
  }
};

module.exports = {
  Query: {
    GetAllTransactions,
    GetOneTransaction,
  },
  Mutation: {
    CreateTransaction,
    UpdateTransaction,
    DeleteTransaction,
  },
  Transaction: {
    cashier,
  },
  TransactionMenu: {
    recipe,
  },
};

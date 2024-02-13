const TransactionModel = require('./transaction.model');
const UserModel = require('../users/user.model');

const moment = require('moment');
const _ = require('lodash')

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

module.exports = {
  Query: {
    GetAllTransactions,
  },
};

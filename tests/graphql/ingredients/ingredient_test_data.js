/* eslint-disable no-undef */
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;

const users = [
  {
    _id: new ObjectId('664ad4ba812ad8494be61a86'),
    username: 'cn94rUOsU',
    first_name: 'Test',
    last_name: 'User',
    status: 'active',
    user_type: {
      _id: new ObjectId('6534b57f56a7ca5ac33c58a5'),
      name: 'Stock Admin',
      status: 'active',
    },
  },
  {
    _id: new ObjectId('664ad46c2c7d1cc6b4f001cc'),
    username: 'MW2Nf6h55',
    first_name: 'Test',
    last_name: 'User',
    status: 'active',
    user_type: {
      _id: new ObjectId('6534afb956a7ca5ac33c58a3'),
      name: 'Restaurant Admin',
      status: 'active',
    },
  },
];

const ingredients = [
  {
    _id: new ObjectId('65bcc07f338ac5da469f76b6'),
    name: 'Chicken',
    stock_amount: 38,
    is_available: true,
    status: 'active',
    is_additional_ingredient: false,
    update_histories: [],
  },
  {
    _id: new ObjectId('65cf1e3e0b90db8784b2d376'),
    name: 'Flour Batter',
    stock_amount: 220,
    is_available: true,
    status: 'active',
    is_additional_ingredient: false,
    update_histories: [],
  },
];

module.exports = {
  users,
  ingredients,
};

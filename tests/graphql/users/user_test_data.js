/* eslint-disable no-undef */
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const userData = {
  _id: new ObjectId('6646d4fac6fc47184acf1cc1'),
  first_name: 'John',
  last_name: 'Doe',
  username: 'johndoe',
  password: 'asdf4567',
  user_type: new ObjectId('6534a9a756a7ca5ac33c58a2'),
};

const userTypeData = {
  _id: new ObjectId('6534a9a756a7ca5ac33c58a2'),
  name: 'General Admin',
  app_permission: {
    homepage: false,
    ingredients: {
      view: true,
      edit: true,
      add_button: true,
      delete: true,
    },
    recipes: {
      view: true,
      edit: true,
      publish: true,
      add_button: true,
      delete: true,
    },
    transactions: {
      view: {
        history: true,
        cart: false,
      },
      edit: false,
      add: false,
      delete: false,
    },
  },
};

module.exports = {
  userData,
  userTypeData,
};

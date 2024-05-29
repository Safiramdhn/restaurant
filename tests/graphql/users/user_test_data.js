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

const userTypeGeneralAdmin = {
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
  status: 'active'
};

const loginData = {
  username: 'testing_user',
  password: 'generaladmin',
};

const userLoginData = {
  _id: new ObjectId('65bb4bb4e163fb4bcfd20999'),
  username: 'testing_user',
  password: '$2b$10$OSuLjwLr5RCDvFaus0bP0eO993bXTwX6kHGpvxmsgAZ1xihPwjwEm',
  first_name: 'Safira',
  last_name: 'Admin',
  status: 'active',
  user_type: new ObjectId('6534a9a756a7ca5ac33c58a2'),
};

const deletedUser = {
  _id: new ObjectId('65bb4fad98866be3730bcf85'),
  username: 'pilakasir2',
  password: '$2b$10$UlQLc00oUrVX9hJ4SvpvnOqyZB0TfECzmbbcKopmh/Fz.s/zpsxKa',
  first_name: 'Cashier',
  last_name: 'pilak',
  status: 'deleted',
  user_type: new ObjectId('6534b03956a7ca5ac33c58a4'),
};

const updatedUser = {
  _id: new ObjectId('6656cfed25941d07987e3e9d'),
  username: 'testing_update',
  first_name: 'Testing',
  last_name: 'Update',
  status: 'active',
  user_type: new ObjectId('6534a9a756a7ca5ac33c58a2'),
};

module.exports = {
  userData,
  userTypeGeneralAdmin,
  loginData,
  userLoginData,
  deletedUser,
  updatedUser,
};

/* eslint-disable no-undef */
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;

const userData = [
  {
    _id: new ObjectId('6646d4fac6fc47184acf1cc1'),
    first_name: 'John',
    last_name: 'Doe',
    username: 'johndoe',
    password: 'asdf4567',
    user_type: new ObjectId('6534a9a756a7ca5ac33c58a2'),
  },
  {
    _id: new ObjectId('65bb4bb4e163fb4bcfd20999'),
    username: 'testing_user',
    password: '$2b$10$OSuLjwLr5RCDvFaus0bP0eO993bXTwX6kHGpvxmsgAZ1xihPwjwEm',
    first_name: 'Safira',
    last_name: 'Admin',
    status: 'active',
    user_type: new ObjectId('6534a9a756a7ca5ac33c58a2'),
  },
  {
    _id: new ObjectId('65bb4fad98866be3730bcf85'),
    username: 'pilakasir2',
    password: '$2b$10$UlQLc00oUrVX9hJ4SvpvnOqyZB0TfECzmbbcKopmh/Fz.s/zpsxKa',
    first_name: 'Cashier',
    last_name: 'pilak',
    status: 'deleted',
    user_type: {
      _id: new ObjectId('6534b03956a7ca5ac33c58a4'),
      name: 'Cashier',
      status: 'active',
    },
  },
  {
    _id: new ObjectId('6656cfed25941d07987e3e9d'),
    username: 'testing_update',
    first_name: 'Testing',
    last_name: 'Update',
    status: 'active',
    user_type: new ObjectId('6534a9a756a7ca5ac33c58a2'),
  },
];

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
  status: 'active',
};

const loginData = {
  username: 'testing_user',
  password: 'generaladmin',
};

const fiveUsers = [
  {
    _id: new ObjectId('664ad44a7195dd3f45101e5b'),
    username: 'aqmuoy28e',
    first_name: 'Test',
    last_name: 'User',
    status: 'active',
    user_type: {
      _id: new ObjectId('6534a9a756a7ca5ac33c58a2'),
      name: 'General Admin',
      status: 'active',
    },
    count_document: 5
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
    count_document: 5
  },
  {
    _id: new ObjectId('664ad4a6d0aca227b312f637'),
    username: 'u9XRkolfs',
    first_name: 'Test',
    last_name: 'User',
    status: 'active',
    user_type: {
      _id: new ObjectId('6534b03956a7ca5ac33c58a4'),
      name: 'Cashier',
      status: 'active',
    },
    count_document: 5
  },
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
    count_document: 5
  },
  {
    _id: new ObjectId('664ad4ed8ace711024feffd3'),
    username: 'i5VJOxfMQ',
    first_name: 'Test',
    last_name: 'User',
    status: 'active',
    user_type: {
      _id: new ObjectId('6534a9a756a7ca5ac33c58a2'),
      name: 'General Admin',
      status: 'active',
    },
    count_document: 5
  },
];

module.exports = {
  userData,
  userTypeGeneralAdmin,
  loginData,
  fiveUsers,
};

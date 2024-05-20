/* eslint-disable no-undef */
require('dotenv').config();
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const randomstring = require('randomstring');

const UserModel = require('../../../graphql/users/user.model');
const UserTypeModel = require('../../../graphql/userTypes/user_type.model');
const { Mutation } = require('../../../graphql/users/user.resolvers');
const UserTestData = require('./user_test_data');

jest.mock('../../../utils/common', () => ({
  getToken: jest.fn(() => {}),
  encrypt: jest.fn(() => {}),
  decrypt: jest.fn(() => {}),
}));

// MUTATION
describe('CreateUser function', () => {
  let mockUserModelFindOne;
  let mockUserModelCreate;
  let mockEncrypt;
  let mockUserTypeModelFindOne;

  beforeEach(async () => {
    jest.clearAllMocks();
    const mongoURI = 'mongodb://' + process.env.DB_TESTING_HOST + '/' + process.env.DB_TESTING_NAME;
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000, // Increase timeout
      socketTimeoutMS: 45000, // Optional: increase socket timeout
    });

    mockUserModelFindOne = jest.spyOn(UserModel, 'findOne');
    mockUserModelCreate = jest.spyOn(UserModel, 'create');
    mockUserTypeModelFindOne = jest.spyOn(UserTypeModel, 'findOne');
  });

  afterEach(async () => {
    await mongoose.connection.close();
    mockUserModelFindOne.mockReset()
  });
  let userInput = {
    first_name: 'Test',
    last_name: 'User',
    username: randomstring.generate(9),
    password: '12345asdfgh',
    user_type: new ObjectId('6534a9a756a7ca5ac33c58a2'),
  };

  it('Should create a user with valid input', async () => {    
    // Mock UserModel.findOne to return null (no existing user type)
    mockUserTypeModelFindOne.mockImplementationOnce();

    // Mock UserModel.create to be a spy
    const mockUserModelCreate = jest.spyOn(UserModel, 'create');

    // Call the Mutation.CreateUser function
    const createUserResult = await Mutation.CreateUser(null, { user_input: userInput });

    // Assert that the correct functions were called with the correct arguments
    expect(mockUserModelFindOne).toHaveBeenCalledTimes(1);
    expect(mockUserTypeModelFindOne).toHaveBeenCalled();
    expect(mockUserModelCreate).toHaveBeenCalledTimes(1);

    // Assert that the returned user is the same as the input
    expect(createUserResult.username).toEqual(userInput.username);
    expect(createUserResult.first_name).toEqual(userInput.first_name);
    expect(createUserResult.last_name).toEqual(userInput.last_name);
    expect(createUserResult.user_type).toEqual(userInput.user_type);
  });

  it('Should throw error for missing input username and password', async () => {
    userInput = {};
    await expect(Mutation.CreateUser(null, { user_input: userInput })).rejects.toThrowError('Username and password are required');

    expect(mockUserModelFindOne).not.toHaveBeenCalled();
    expect(mockUserModelCreate).not.toHaveBeenCalled();
  });

  it('throws error for invalid user type', async () => {
    userInput.username = 'jest'
    userInput.user_type = new ObjectId();
    await expect(Mutation.CreateUser(null, { user_input: userInput })).rejects.toThrowError('Invalid user type');

    expect(mockUserModelCreate).not.toHaveBeenCalled();
  });

  it('Should throw error for existed username', async () => {
    userInput.username = UserTestData.userData.username;
    mockUserModelFindOne.mockImplementation(() => {
      return {
        lean: jest.fn().mockReturnValue(UserTestData.userData),
      };
    });
    await expect(Mutation.CreateUser(null, { user_input: userInput })).rejects.toThrowError('Username already existed');

    expect(mockUserModelCreate).not.toHaveBeenCalled();
  });
});

/* eslint-disable no-undef */
require('dotenv').config();
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const randomstring = require('randomstring');

const UserModel = require('../../../graphql/users/user.model');
const UserTypeModel = require('../../../graphql/userTypes/user_type.model');
const { Mutation } = require('../../../graphql/users/user.resolvers');
const UserTestData = require('./user_test_data');
const { encrypt, decrypt, getToken } = require('../../../utils/common');


jest.mock('../../../utils/common', () => ({
  getToken: jest.fn(),
  encrypt: jest.fn(),
  decrypt: jest.fn(),
}));

// MUTATION
describe('CreateUser function', () => {
  let mockUserModelFindOne;
  let mockUserTypeModelFindOne;
  let mockUserModelCreate;

  // connect once to database for testing
  beforeAll(async () => {
    const mongoURI = `mongodb://${process.env.DB_TESTING_HOST}/${process.env.DB_TESTING_NAME}`;
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
  });

  // close database connection
  afterAll(async () => {
    await mongoose.connection.close();
  });

  // initiate before run each testing
  beforeEach(() => {
    // clear mock
    jest.clearAllMocks();
    
    // define mock for database
    mockUserModelFindOne = jest.spyOn(UserModel, 'findOne');
    mockUserTypeModelFindOne = jest.spyOn(UserTypeModel, 'findOne');
    mockUserModelCreate = jest.spyOn(UserModel, 'create');
  });

  let userInput = {
    first_name: 'Test',
    last_name: 'User',
    username: randomstring.generate(9),
    password: '12345asdfgh',
    user_type: new ObjectId('6534a9a756a7ca5ac33c58a2'),
  };

  it('Should create a user with valid input', async () => {
    // user model find one return null because no existed user
    mockUserModelFindOne.mockImplementation(() => {
      return {
        lean: jest.fn().mockResolvedValue(null)
      }
    });
    // find user type once
    mockUserTypeModelFindOne.mockImplementationOnce();
    encrypt.mockReturnValue(userInput.password);

    // user model create return user object
    mockUserModelCreate.mockResolvedValue({
      ...userInput,
      _id: new ObjectId(),
    });

    // call create user function
    const createUserResult = await Mutation.CreateUser(null, { user_input: userInput });

    // declare expectation
    expect(mockUserModelFindOne).toHaveBeenCalledTimes(1);
    expect(encrypt).toHaveBeenCalledTimes(1);
    expect(encrypt).toHaveBeenCalledWith(userInput.password, 10);
    expect(mockUserTypeModelFindOne).toHaveBeenCalledTimes(1);
    expect(mockUserModelCreate).toHaveBeenCalledTimes(1);

    expect(createUserResult.username).toEqual(userInput.username);
    expect(createUserResult.first_name).toEqual(userInput.first_name);
    expect(createUserResult.last_name).toEqual(userInput.last_name);
    expect(createUserResult.user_type).toEqual(userInput.user_type);
  });

  it('Should throw error for missing input username and password', async () => {
    // remove all user input
    userInput = {};
    // create user function will throw error
    await expect(Mutation.CreateUser(null, { user_input: userInput })).rejects.toThrowError('Username and password are required');

    // declare expectation not called other database function because throwing error
    expect(mockUserModelFindOne).not.toHaveBeenCalled();
    expect(mockUserModelCreate).not.toHaveBeenCalled();
  });

  it('Should throw error for existed username', async () => {
    // user model find one return user object because existed user
    mockUserModelFindOne.mockImplementation(() => {
      return {
        lean: jest.fn().mockReturnValue(UserTestData.userData),
      };
    });
    userInput.username = UserTestData.userData.username;

    // call create user function with existed username then throwing error
    await expect(Mutation.CreateUser(null, { user_input: userInput })).rejects.toThrowError('Username already existed');

    // declare expectation after throw error
    expect(mockUserModelCreate).not.toHaveBeenCalled();
  });

  it('Should throw error for invalid user type', async () => {
    // user model find one return null because no existed user
    mockUserModelFindOne.mockImplementation(() => {
      return {
        lean: jest.fn().mockResolvedValue(null)
      }
    });
    // find user type once
    mockUserTypeModelFindOne.mockImplementationOnce();

    // uodate user_type id
    userInput.user_type = new ObjectId();

    // call create user function with new user type id then throw error
    await expect(Mutation.CreateUser(null, { user_input: userInput })).rejects.toThrowError('Invalid user type');

    // declare expectation before and after throw error
    expect(mockUserModelFindOne).toHaveBeenCalledTimes(1);
    expect(mockUserTypeModelFindOne).toHaveBeenCalledTimes(1);
    expect(mockUserModelCreate).not.toHaveBeenCalled();
  });
});

describe('Login function', () => {
  let mockUserModelFindOne
  beforeAll(async () => {
    const mongoURI = `mongodb://${process.env.DB_TESTING_HOST}/${process.env.DB_TESTING_NAME}`;
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(() => {
    jest.resetAllMocks();
    mockUserModelFindOne = jest.spyOn(UserModel, 'findOne');
  });

  it('Should return JWT token for valid credential and active user', async () => {
    mockUserModelFindOne.mockImplementation(() => {
      return {
        lean: jest.fn().mockReturnValue(UserTestData.userLoginData),
      }
    });

    decrypt.mockReturnValue(true);
    getToken.mockReturnValue('mocked_jwt_token');

    const loginResult = await Mutation.Login(null, UserTestData.loginData);

    expect(mockUserModelFindOne).toHaveBeenCalledTimes(1);
    expect(mockUserModelFindOne).toHaveBeenCalledWith({
      username: UserTestData.loginData.username,
    });

    expect(decrypt).toHaveBeenCalledTimes(1);
    expect(decrypt).toHaveBeenCalledWith(UserTestData.loginData.password, UserTestData.userLoginData.password);

    expect(getToken).toHaveBeenCalledTimes(1);
    expect(getToken).toHaveBeenCalledWith({userId: UserTestData.userLoginData._id});

    expect(loginResult).toEqual({token: 'mocked_jwt_token'});
  });

  it('Should throw error for user not found', async () => {
    mockUserModelFindOne.mockImplementation(() => {
      return {
        lean: jest.fn().mockResolvedValue(null)
      };
    });
    
    UserTestData.loginData.username = randomstring.generate(9);
    await expect(Mutation.Login(null, UserTestData.loginData)).rejects.toThrowError('User not found');
    
    expect(decrypt).not.toHaveBeenCalledTimes(1);

    expect(getToken).not.toHaveBeenCalledTimes(1);
  });

  it('Should throw error for user status is deleted', async() => {
    mockUserModelFindOne.mockImplementation(() => {
      return {
        lean: jest.fn().mockResolvedValue(UserTestData.deletedUser)
      };
    });
    
    UserTestData.loginData.username = UserTestData.deletedUser.username;
    await expect(Mutation.Login(null, UserTestData.loginData)).rejects.toThrowError(`User ${UserTestData.deletedUser.username} is deleted`);
    
    expect(decrypt).not.toHaveBeenCalledTimes(1);

    expect(getToken).not.toHaveBeenCalledTimes(1);
  });

  it('Should throw error for invalid password', async() => {
    mockUserModelFindOne.mockImplementation(() => {
      return {
        lean: jest.fn().mockResolvedValue(UserTestData.userLoginData)
      };
    });
    
    UserTestData.loginData.password = randomstring.generate(8);

    await expect(Mutation.Login(null, UserTestData.loginData)).rejects.toThrowError('Invalid Password');
    
    expect(decrypt).toHaveBeenCalledTimes(1);
    expect(decrypt).toHaveBeenCalledWith(UserTestData.loginData.password, UserTestData.userLoginData.password);
      
    expect(getToken).not.toHaveBeenCalled();
  });
});
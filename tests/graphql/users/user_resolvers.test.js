/* eslint-disable no-undef */
require('dotenv').config();
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const randomstring = require('randomstring');

const UserModel = require('../../../graphql/users/user.model');
const UserTypeModel = require('../../../graphql/userTypes/user_type.model');
const { Mutation, Query } = require('../../../graphql/users/user.resolvers');
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
        lean: jest.fn().mockResolvedValue(null),
      };
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
        lean: jest.fn().mockReturnValue(UserTestData.userData[0]),
      };
    });
    userInput.username = UserTestData.userData[0].username;

    // call create user function with existed username then throwing error
    await expect(Mutation.CreateUser(null, { user_input: userInput })).rejects.toThrowError('Username already existed');

    // declare expectation after throw error
    expect(mockUserModelCreate).not.toHaveBeenCalled();
  });

  it('Should throw error for invalid user type', async () => {
    // user model find one return null because no existed user
    mockUserModelFindOne.mockImplementation(() => {
      return {
        lean: jest.fn().mockResolvedValue(null),
      };
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
  let mockUserModelFindOne;

  // connect to testing database
  beforeAll(async () => {
    const mongoURI = `mongodb://${process.env.DB_TESTING_HOST}/${process.env.DB_TESTING_NAME}`;
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
  });

  // close connection to database
  afterAll(async () => {
    await mongoose.connection.close();
  });

  // initiate before run each of test
  beforeEach(() => {
    jest.resetAllMocks();
    mockUserModelFindOne = jest.spyOn(UserModel, 'findOne');
  });

  it('Should return JWT token for valid credential and active user', async () => {
    // mock user find one return user login data
    mockUserModelFindOne.mockImplementation(() => {
      return {
        lean: jest.fn().mockReturnValue(UserTestData.userData[1]),
      };
    });

    // mock common function to decrypt and get token to return value
    decrypt.mockReturnValue(true);
    getToken.mockReturnValue('mocked_jwt_token');

    // call login mutation
    const loginResult = await Mutation.Login(null, UserTestData.loginData);

    // expectation
    expect(mockUserModelFindOne).toHaveBeenCalledTimes(1);
    expect(mockUserModelFindOne).toHaveBeenCalledWith({
      username: UserTestData.loginData.username,
    });

    expect(decrypt).toHaveBeenCalledTimes(1);
    expect(decrypt).toHaveBeenCalledWith(UserTestData.loginData.password, UserTestData.userData[1].password);

    expect(getToken).toHaveBeenCalledTimes(1);
    expect(getToken).toHaveBeenCalledWith({ userId: UserTestData.userData[1]._id });

    expect(loginResult).toEqual({ token: 'mocked_jwt_token' });
  });

  it('Should throw error for user not found', async () => {
    // update username with random string
    UserTestData.loginData.username = randomstring.generate(9);

    // mock user find one return null
    mockUserModelFindOne.mockImplementation(() => {
      return {
        lean: jest.fn().mockResolvedValue(null),
      };
    });

    // expect login mutation reject and throw error
    await expect(Mutation.Login(null, UserTestData.loginData)).rejects.toThrowError('User not found');

    // expectation
    expect(decrypt).not.toHaveBeenCalledTimes(1);

    expect(getToken).not.toHaveBeenCalledTimes(1);
  });

  it('Should throw error for user status is deleted', async () => {
    // update username to deleted username
    UserTestData.loginData.username = UserTestData.userData[2].username;
    // mock user find one return deleted user
    mockUserModelFindOne.mockImplementation(() => {
      return {
        lean: jest.fn().mockResolvedValue(UserTestData.userData[2]),
      };
    });

    // expect mutation login reject and throw error
    await expect(Mutation.Login(null, UserTestData.loginData)).rejects.toThrowError(`User ${UserTestData.userData[2].username} is deleted`);
    // expectation
    expect(decrypt).not.toHaveBeenCalledTimes(1);
    expect(getToken).not.toHaveBeenCalledTimes(1);
  });

  it('Should throw error for invalid password', async () => {
    // update password to random string
    UserTestData.loginData.password = randomstring.generate(8);
    // mock user find one return user data
    mockUserModelFindOne.mockImplementation(() => {
      return {
        lean: jest.fn().mockResolvedValue(UserTestData.userData[1]),
      };
    });

    // expect mutation login reject and throw error
    await expect(Mutation.Login(null, UserTestData.loginData)).rejects.toThrowError('Invalid Password');

    // expectation
    expect(decrypt).toHaveBeenCalledTimes(1);
    expect(decrypt).toHaveBeenCalledWith(UserTestData.loginData.password, UserTestData.userData[1].password);
    expect(getToken).not.toHaveBeenCalled();
  });
});

describe('UpdateUser function', () => {
  let mockUserModelFindById;
  let mockUserModelFindOne;
  let mockUserTypeModelFindOne;
  let mockUserModelFindByIdAndUpdate;
  let user_input;

  // connect to testing database
  beforeAll(async () => {
    const mongoURI = `mongodb://${process.env.DB_TESTING_HOST}/${process.env.DB_TESTING_NAME}`;
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
  });

  // disconnect from testing database
  afterAll(async () => {
    await mongoose.connection.close();
  });

  // initiate before run each of test
  beforeEach(() => {
    jest.resetAllMocks();
    mockUserModelFindById = jest.spyOn(UserModel, 'findById');
    mockUserModelFindOne = jest.spyOn(UserModel, 'findOne');
    mockUserTypeModelFindOne = jest.spyOn(UserTypeModel, 'findOne');
    mockUserModelFindByIdAndUpdate = jest.spyOn(UserModel, 'findByIdAndUpdate');
    user_input = {
      username: randomstring.generate(9),
      first_name: 'Valid',
      last_name: 'User',
      user_type: new ObjectId('6534b03956a7ca5ac33c58a4'),
    };
  });

  it('Should update a user with valid id and update input', async () => {
    // set id
    let userId = UserTestData.userData[3]._id;

    // mock user find by id return user data
    mockUserModelFindById.mockImplementation(() => {
      return {
        lean: jest.fn().mockReturnValue(UserTestData.userData[3]),
      };
    });
    // mock user find one return null
    mockUserModelFindOne.mockImplementation(() => {
      return {
        lean: jest.fn().mockResolvedValue(null),
      };
    });
    // mock user type find one return user type id
    mockUserTypeModelFindOne.mockImplementation(() => {
      return {
        lean: jest.fn().mockResolvedValue({
          _id: user_input.user_type,
        }),
      };
    });
    // mock user find by id and update return user data
    mockUserModelFindByIdAndUpdate.mockResolvedValue({
      ...UserTestData.userData[3],
      username: user_input.username,
      first_name: user_input.first_name,
      last_name: user_input.last_name,
      user_type: user_input.user_type,
    });

    // call mutation UpdateUser
    const updateUserResult = await Mutation.UpdateUser(null, { userId, user_input });

    // expectation
    expect(mockUserModelFindById).toHaveBeenCalledTimes(1);
    expect(mockUserModelFindOne).toHaveBeenCalledTimes(1);
    expect(mockUserTypeModelFindOne).toHaveBeenCalledTimes(1);
    expect(mockUserModelFindByIdAndUpdate).toHaveBeenCalledTimes(1);
    // expect similarities result and input test data
    expect(updateUserResult.username).toEqual(user_input.username);
    expect(updateUserResult.first_name).toEqual(user_input.first_name);
    expect(updateUserResult.last_name).toEqual(user_input.last_name);
    expect(updateUserResult.user_type).toEqual(user_input.user_type);
  });

  it('Should throw error for user not found', async () => {
    // generate random id
    const invalidUserId = new ObjectId();

    // mock user find id return null
    mockUserModelFindById.mockImplementation(() => {
      return {
        lean: jest.fn().mockResolvedValue(null),
      };
    });
    // expect mutatuon updateuser reject and throw error
    await expect(Mutation.UpdateUser(null, { invalidUserId, user_input })).rejects.toThrowError('User not found');

    // expectation
    expect(mockUserModelFindById).toHaveBeenCalledTimes(1);
    expect(mockUserModelFindOne).not.toHaveBeenCalled();
    expect(mockUserTypeModelFindOne).not.toHaveBeenCalled();
    expect(mockUserModelFindByIdAndUpdate).not.toHaveBeenCalled();
  });

  it('Should throw error for user status is deleted', async () => {
    // set id with deleted user test data
    const deletedUserId = UserTestData.userData[2]._id;

    // mock user find by id return deleted user
    mockUserModelFindById.mockImplementation(() => {
      return {
        lean: jest.fn().mockReturnValue({
          status: UserTestData.userData[2].status,
        }),
      };
    });
    // expdect mutation updateuser reject and throw error
    await expect(Mutation.UpdateUser(null, { deletedUserId, user_input })).rejects.toThrowError('User is already deleted');

    // expectation
    expect(mockUserModelFindById).toHaveBeenCalledTimes(1);
    expect(mockUserModelFindOne).not.toHaveBeenCalled();
    expect(mockUserTypeModelFindOne).not.toHaveBeenCalled();
    expect(mockUserModelFindByIdAndUpdate).not.toHaveBeenCalled();
  });

  it('Should throw error for existed username', async () => {
    // set id
    const userId = UserTestData.userData[3]._id;
    // set username input with existed username
    user_input.username = UserTestData.userData[0].username;

    // mock user find by id return user data
    mockUserModelFindById.mockImplementation(() => {
      return {
        lean: jest.fn().mockResolvedValue(UserTestData.userData[3]),
      };
    });

    // mock user find one return user data
    mockUserModelFindOne.mockImplementation(() => {
      return {
        lean: jest.fn().mockReturnValue(UserTestData.userData[0]),
      };
    });
    // expect mutation updateuser reject and throw error
    await expect(Mutation.UpdateUser(null, { userId, user_input })).rejects.toThrowError(`Username ${user_input.username} is already existed`);

    // expectation
    expect(mockUserModelFindById).toHaveBeenCalledTimes(1);
    expect(mockUserModelFindOne).toHaveBeenCalledTimes(1);
    expect(mockUserTypeModelFindOne).not.toHaveBeenCalled();
    expect(mockUserModelFindByIdAndUpdate).not.toHaveBeenCalled();
  });

  it('Should throw error for invalid user type', async () => {
    // set id
    const userId = UserTestData.userData[3]._id;
    // set random user type id
    user_input.user_type = new ObjectId();

    // mock user find by id return user data
    mockUserModelFindById.mockImplementation(() => {
      return {
        lean: jest.fn().mockReturnValue(UserTestData.userData[3]),
      };
    });
    // user model find one return null because no existed user
    mockUserModelFindOne.mockImplementation(() => {
      return {
        lean: jest.fn().mockResolvedValue(null),
      };
    });
    // find user type once return null
    mockUserTypeModelFindOne.mockImplementationOnce(() => {
      return {
        lean: jest.fn().mockResolvedValue(null),
      };
    });

    // call update user function with new user type id then throw error
    await expect(Mutation.UpdateUser(null, { userId, user_input })).rejects.toThrowError('Invalid user type');

    // declare expectation before and after throw error
    expect(mockUserModelFindById).toHaveBeenCalledTimes(1);
    expect(mockUserModelFindOne).toHaveBeenCalledTimes(1);
    expect(mockUserTypeModelFindOne).toHaveBeenCalledTimes(1);
    expect(mockUserModelFindByIdAndUpdate).not.toHaveBeenCalled();
  });
});

describe('DeleteUser function', () => {
  let mockUserModelFindById;
  let mockUserModelFindByIdAndUpdate;

  // Connect to testing database
  beforeAll(async () => {
    const mongoURI = `mongodb://${process.env.DB_TESTING_HOST}/${process.env.DB_TESTING_NAME}`;
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
  });

  // disconnect from testing database
  afterAll(async () => {
    await mongoose.connection.close();
  });

  // initiate before run each of test
  beforeEach(() => {
    jest.resetAllMocks();
    mockUserModelFindById = jest.spyOn(UserModel, 'findById');
    mockUserModelFindByIdAndUpdate = jest.spyOn(UserModel, 'findByIdAndUpdate');
  });

  it('Should mark status as deleted with valid id', async () => {
    // set user id
    const userId = UserTestData.userData[2]._id;
    // mock user find by id return user data
    mockUserModelFindById.mockImplementation(() => {
      return {
        populate: jest.fn().mockResolvedValue(UserTestData.userData[2]),
      };
    });
    // mock user find by id and update return deleted user
    mockUserModelFindByIdAndUpdate.mockResolvedValue({
      ...UserTestData.userData[2],
    });

    // get result of d4lete user mutation
    const deleteUserResult = await Mutation.DeleteUser(null, { userId });
    // declare expectation before and after run the mutation
    expect(mockUserModelFindById).toHaveBeenCalledTimes(1);
    expect(mockUserModelFindByIdAndUpdate).toHaveBeenCalledTimes(1);
    expect(deleteUserResult).toEqual(`user ${UserTestData.userData[2].first_name} ${UserTestData.userData[2].last_name} has been deleted`);
  });

  it('Should throw error for user type General Admin', async () => {
    // set user id
    const userId = UserTestData.userData[2]._id;
    // set user type General Admin
    UserTestData.userData[2].user_type.name = 'General Admin';
    // mock user find by id return user data
    mockUserModelFindById.mockImplementation(() => {
      return {
        populate: jest.fn().mockResolvedValue(UserTestData.userData[2]),
      };
    });

    // expect delete user mutation reject and throw an error
    await expect(Mutation.DeleteUser(null, { userId })).rejects.toThrowError('You cannot delete General Admin user');
    // declare expectation before and after throw error
    expect(mockUserModelFindById).toHaveBeenCalledTimes(1);
    expect(mockUserModelFindByIdAndUpdate).not.toHaveBeenCalled;
  });
});

// QUERY

describe('GetAllUsers function', () => {
  let mockUserModelAggregate;
  let pagination;

  // Connect to testing database
  beforeAll(async () => {
    const mongoURI = `mongodb://${process.env.DB_TESTING_HOST}/${process.env.DB_TESTING_NAME}`;
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
  });

  // disconnect from testing database
  afterAll(async () => {
    await mongoose.connection.close();
  });

  // initiate before run each of test
  beforeEach(() => {
    jest.resetAllMocks();
    mockUserModelAggregate = jest.spyOn(UserModel, 'aggregate');
    pagination = {
      limit: 5,
      page: 0,
    };
  });

  it('Should get users data based on filter, sorting and pagination', async () => {
    // sort test data based on username
    const userSortByUsername = UserTestData.fiveUsers.sort((a, b) => a.username.localeCompare(b.username));

    // mock user aggregate return value array of object
    mockUserModelAggregate.mockResolvedValue([
      {
        data: userSortByUsername,
        countData: [
          {
            _id: null,
            count: userSortByUsername.length,
          },
        ],
      },
    ]);

    // get result from get all users query
    const getAllUsersResult = await Query.GetAllUsers(
      {},
      {
        filter: {
          full_name: 'Test User',
        },
        sorting: {
          username: 'asc',
        },
        pagination,
      }
    );

    // declare expectation before and after result
    expect(mockUserModelAggregate).toHaveBeenCalledTimes(1);
    expect(getAllUsersResult).toStrictEqual(userSortByUsername);
  });

  it('Should get users data based on filter and pagination', async () => {
    // filter user test data based on username
    const filteredUser = UserTestData.fiveUsers.filter((user) => user.username === 'cn94rUOsU');
    // mock user aggregate return value array of object
    mockUserModelAggregate.mockResolvedValue([
      {
        data: filteredUser,
        countData: [
          {
            _id: null,
            count: filteredUser.length,
          },
        ],
      },
    ]);

    // get result from get all users query
    const getAllUsersResult = await Query.GetAllUsers(
      {},
      {
        filter: { username: 'cn94rUOsU' },
        sorting: null,
        pagination,
      }
    );

    // declare expectation before and after result
    expect(mockUserModelAggregate).toHaveBeenCalledTimes(1);
    expect(getAllUsersResult).toStrictEqual([
      {
        ...filteredUser[0],
        count_document: filteredUser.length,
      },
    ]);
  });

  it('Should get users data based on sorting and pagination', async () => {
    const userSortByUserType = UserTestData.userData.sort((a, b) => a.user_type.name - b.user_type.name);
    userSortByUserType.reverse();
    mockUserModelAggregate.mockResolvedValue([
      {
        data: userSortByUserType,
        countData: [
          {
            _id: null,
            count: userSortByUserType.length,
          },
        ],
      },
    ]);

    const getAllUsersResult = await Query.GetAllUsers(
      {},
      {
        filter: null,
        sorting: {
          user_type: 'desc',
        },
        pagination,
      }
    );

    expect(mockUserModelAggregate).toHaveBeenCalledTimes(1);
    expect(getAllUsersResult).toStrictEqual(userSortByUserType);
  });

  it('Should get users data based on filter and sorting', async () => {
    const filteredUser = UserTestData.fiveUsers.filter((user) => String(user.user_type) === '6534a9a756a7ca5ac33c58a2');
    filteredUser.map((user) => {
      user.fullname = `${user.first_name} ${user.last_name}`;
    });
    const userSortByFullname = filteredUser.sort((a, b) => a.fullname.localeCompare(b.fullname));

    mockUserModelAggregate.mockResolvedValue(userSortByFullname);

    const getAllUsersResult = await Query.GetAllUsers(
      {},
      {
        filter: {
          user_type: '6534a9a756a7ca5ac33c58a2',
        },
        sorting: {
          user_type: 'desc',
        },
      }
    );

    expect(mockUserModelAggregate).toHaveBeenCalledTimes(1);
    expect(getAllUsersResult).toStrictEqual(userSortByFullname);
  });

  it('Should get users data without using any of filter, sorting or pagination', async () => {
    mockUserModelAggregate.mockImplementation(UserTestData.fiveUsers);

    const getAllUsersResult = await Query.GetAllUsers({}, {});

    expect(mockUserModelAggregate).toHaveBeenCalled(1);
    expect(getAllUsersResult).toStrictEqual(UserTestData.fiveUsers);
  });
  
  it('Should return empty array if didn’t match the filter', async () => {
    mockUserModelAggregate.mockResolvedValue([]);

    const filterFullnameResult = await Query.GetAllUsers(
      {},
      {
        filter: {
          full_name: randomstring.generate(9),
        },
      }
    );

    const filterUsernameResult = await Query.GetAllUsers(
      {},
      {
        filter: {
          username: randomstring.generate(9),
        },
      }
    );

    const filterUserTypeResult = await Query.GetAllUsers(
      {},
      {
        filter: {
          user_type: new ObjectId(),
        },
      }
    );

    expect(mockUserModelAggregate).toHaveBeenCalled(3);
    expect(filterFullnameResult).toStrictEqual([]);
    expect(filterUsernameResult).toStrictEqual([]);
    expect(filterUserTypeResult).toStrictEqual([]);
  });
});
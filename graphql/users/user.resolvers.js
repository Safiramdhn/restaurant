const UserModel = require('./user.model');
const UserTypeModel = require('../userTypes/user_type.model');

const { getToken, encrypt, decrypt } = require('../../utils/common');

//**** Query */
const GetAllUsers = async (parent) => {
  const users = await UserModel.find({ status: 'active' }).lean();
  return users;
};

const GetOneUser = async (parent, { _id }) => {
  const user = await UserModel.findOne({ _id, status: 'active' }).lean();
  if (!user) throw new Error('User not found');
  return user;
};

//**** Mutation */
const CreateUser = async (parent, { user_input }) => {
  if (!user_input.username && !user_input.password) throw new Error('Username and password are required');

  const existedUser = await UserModel.findOne({ username: user_input.username }).lean();
  if (existedUser) throw new Error('Username already existed');

  if (user_input.password) {
    user_input.password = await encrypt(user_input.password, 10);
  }

  if (user_input.gender) {
    user_input.civility = user_input.gender === 'male' ? 'mr' : 'mrs';
  }

  if (user_input.user_type) {
    const userType = await UserTypeModel.findOne({ _id: user_input.user_type, status: 'active' }).lean();
    if (!userType) throw new Error('Invalid user type');
  }

  const user = await UserModel.create(user_input);
  return user;
};

const Login = async (parent, { username, password }) => {
  const user = await UserModel.findOne({
    username: username,
  }).lean();

  if (!user) {
    throw new Error('User not found');
  } else if (user.status === 'deleted') {
    throw new Error(`User ${username} is deleted`);
  }

  const decryptedPass = await decrypt(password, user.password);
  if (decryptedPass) {
    const tokenData = { userId: user._id };
    const token = await getToken(tokenData);
    return { token };
  } else {
    throw new Error('Invalid Password');
  }
};

const UpdateUser = async (parent, { _id, user_input }) => {
  const oldUser = await UserModel.findById(_id).lean();
  if (!oldUser) {
    throw new Error('User not found');
  } else if (oldUser.status === 'deleted') {
    throw new Error('User is already deleted');
  }

  if (user_input.username && user_input.username !== oldUser.username) {
    let existedUser = await UserModel.findOne({ username: user_input.username }).lean;
    if (existedUser) throw new Error(`Username ${user_input.username} is already existed`);
  }

  if (user_input.gender && user_input.gender !== oldUser.gender) {
    user_input.civility = user_input.gender === 'male' ? 'mr' : 'mrs';
  }

  if (user_input.civility && user_input.civility !== oldUser.civility) {
    user_input.gender = user_input.civility === 'mr' ? 'male' : 'female';
  }

  if (user_input.user_type && user_input.user_type.toString() !== oldUser.user_type.toString()) {
    const userType = await UserTypeModel.findOne({ _id: user_input.user_type, status: 'active' }).lean();
    if (!userType) throw new Error('Invalid user type');
  }

  const updateUser = await UserModel.findByIdAndUpdate(_id, { $set: user_input }, { new: true });
  return updateUser;
};

const DeleteUser = async (parent, { _id }) => {
  const user = await UserModel.findById(_id).populate({ path: 'user_type' });
  if (user.user_type.name === 'General Admin') {
    throw new Error('You cannot delete General Admin user');
  }
  await UserModel.findByIdAndUpdate(_id, {
    $set: {
      status: 'deleted',
    },
  });
  return `user ${user.first_name} ${user.last_name} has been deleted`;
};

//**** Loader */
const user_type = async (parent, agrs, context) => {
  if (parent.user_type) {
    const result = await context.loaders.UserTypeLoader.load(parent.user_type);
    return result;
  }
};

module.exports = {
  Query: {
    GetAllUsers,
    GetOneUser,
  },
  Mutation: {
    CreateUser,
    Login,
    UpdateUser,
    DeleteUser,
  },
  User: {
    user_type,
  },
};

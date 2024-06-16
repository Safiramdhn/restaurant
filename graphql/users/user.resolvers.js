const UserModel = require('./user.model');
const UserTypeModel = require('../userTypes/user_type.model');

const { getToken, encrypt, decrypt } = require('../../utils/common');

const _ = require('lodash');

//**** Query */
const GetAllUsers = async (parent, { filter, sorting, pagination }) => {
  let aggregateQuery = [];
  let queryFilter = {
    $and: [{ status: 'active' }],
  };
  let sort = {};

  if ((filter && filter.full_name) || (sorting && sorting.full_name)) {
    aggregateQuery.push({
      $addFields: {
        fullname: {
          $concat: ['$first_name', ' ', '$last_name'],
        },
      },
    });
  }

  if (filter) {
    if (filter.full_name) {
      queryFilter.$and.push({ fullname: { $regex: filter.full_name, $options: 'i' } });
    }

    if (filter.user_type) {
      queryFilter.$and.push({ user_type: filter.user_type });
    }

    if (filter.username) {
      queryFilter.$and.push({ username: { $regex: filter.username, $options: 'i' } });
    }
  }

  if (sorting) {
    if (sorting.full_name) {
      sort = { ...sort, fullname: sorting.full_name === 'asc' ? 1 : -1 };
    } else if (sorting.user_type) {
      aggregateQuery.push(
        {
          $lookup: {
            from: 'user_types',
            localField: 'user_type',
            foreignField: '_id',
            as: 'user_type_populate',
          },
        },
        {
          $addField: {
            user_type_populate: { $arrayElemAt: ['$user_type_populate', 0] },
          },
        }
      );

      sort = { ...sort, 'user_type_populate.name': sorting.user_type === 'asc' ? 1 : -1 };
    } else if (sorting.username) {
      sort = { ...sort, username: sorting.username === 'asc' ? 1 : -1 };
    }

    aggregateQuery.push(
      {
        $match: queryFilter,
      },
      {
        $sort: sort && !_.isEmpty(sort) ? sort : { createAt: -1 },
      }
    );

    // use $facet if use pagination
    if (pagination) {
      aggregateQuery.push({
        $facet: {
          data: [{ $skip: pagination.limit * pagination.page }, { $limit: pagination.limit }],
          countData: [{ $group: { _id: null, count: { $sum: 1 } } }],
        },
      });
      let users = await UserModel.aggregate(aggregateQuery);
      return users[0].data.map((user) => {
        return {
          ...user,
          count_document: users[0].countData[0].count,
        };
      });
    } else {
      let users = await UserModel.aggregate(aggregateQuery);
      return users.map((user) => {
        return {
          ...user,
        };
      });
    }
  }
};

const GetOneUser = async (parent, { _id }) => {
  const user = await UserModel.findOne({ _id, status: 'active' }).lean();
  if (!user) throw new Error('User not found');
  return user;
};

//**** Mutation */
const CreateUser = async (parent, { user_input }) => {
  if (!user_input.username && !user_input.password) throw new Error('Username and password are required');

  const existedUser = await UserModel.findOne({ username: user_input.username, status: 'active' }).lean();
  if (existedUser) throw new Error('Username already existed');

  if (user_input.password) {
    user_input.password = await encrypt(user_input.password, 10);
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
    let existedUser = await UserModel.findOne({ _id: { $ne: _id }, username: user_input.username, status: 'active' }).lean();
    if (existedUser) throw new Error(`Username ${user_input.username} is already existed`);
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
const user_type = async (parent, args, context) => {
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

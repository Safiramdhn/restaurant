const UserTypeModel = require('./user_type.model');

// ******** query
const GetAllUserTypes = async () => {
  const userTypes = await UserTypeModel.find().lean();
  return userTypes;
};

const GetOneUserType = async (parent, { _id }) => {
  const userType = await UserTypeModel.findById(_id).lean();
  return userType;
};

module.exports = {
  Query: {
    GetAllUserTypes,
    GetOneUserType,
  },
};

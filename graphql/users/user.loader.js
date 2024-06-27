const DataLoader = require('dataloader');

const UserModel = require('./user.model');

const UserLoaderData = async (userIds) => {
  let users = await UserModel.find({
    _id: { $in: userIds },
  }).lean();

  let userMap = new Map();
  users.forEach((user) => {
    userMap.set(user._id.toString(), user);
  });
  return userIds.map((id) => userMap.get(id.toString()));
};

exports.UserLoader = () => new DataLoader(UserLoaderData);

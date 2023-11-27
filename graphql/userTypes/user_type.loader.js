const DataLoader = require('dataloader');

const UserTypeModel = require('./user_type.model');

const UserTypeLoaderData = async (userTypeIds) => {
	let userTypes = await UserTypeModel.find({
		_id: { $in: userTypeIds },
	}).lean();

	let userTypeMap = new Map();
	userTypes.forEach((userType) => {
		userTypeMap.set(userType._id.toString(), userType);
	});
	return userTypeIds.map((id) => userTypeMap.get(id.toString()));
};

exports.UserTypeLoader = () => new DataLoader(UserTypeLoaderData);

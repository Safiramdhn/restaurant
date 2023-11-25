const DataLoader = require('dataloader');

const UserTypeModel = require('./user_type.model');

const UserTypeLoaderData = async (userTypeIds) => {
	console.log('userTypeIds', userTypeIds);
	let userTypes = await UserTypeModel.find({
		status: 'active',
		_id: { $in: userTypeIds },
	}).lean();
	console.log('userTypes', userTypes);

	let userTypeMap = new Map();
	userTypes.forEach((userType) => {
		userTypeMap.set(userType._id.toString(), userType);
	});
	console.log('userTypes 2', userTypes);
	return userTypeIds.map((id) => userTypeMap.get(id.toString()));
};

exports.UserTypeLoader = () => new DataLoader(UserTypeLoaderData);

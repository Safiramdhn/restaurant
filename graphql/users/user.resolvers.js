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

	if (user_input.user_type_id) {
		const userType = await UserTypeModel.findOne({ _id: user_input.user_type_id, status: 'active' }).lean();
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

//**** Loader */
const user_type_id = async (parent, agrs, context) => {
	if (parent.user_type_id) {
		const result = await context.loaders.UserTypeLoader.load(parent.user_type_id);
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
	},
	User: {
		user_type_id,
	},
};

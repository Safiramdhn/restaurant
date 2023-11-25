const bcrypt = require('bcrypt');

const UserModel = require('./user.model');
// const UserTypeModel = require('../userTypes/user_type.model');

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
		user_input.password = await bcrypt.hash(user_input.password, 10);
	}

	if (user_input.gender) {
		user_input.civility = user_input.gender === 'male' ? 'mr' : 'mrs';
	}

	const user = await UserModel.create(user_input);
	return user;
};

//**** Loader */
const user_type_id = async(parent, agrs, context) => {
    if(parent.user_type_id) {
        const result = await context.loaders.UserTypeLoader.load(parent.user_type_id);
        return result;
    }
}
module.exports = {
	Query: {
		GetAllUsers,
		GetOneUser,
	},
	Mutation: {
		CreateUser,
	},
    User: {
        user_type_id
    }
};

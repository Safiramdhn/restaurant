const { UserTypeLoader } = require('../graphql/userTypes/user_type.loader');
const {UserLoader} = require('../graphql/users/user.loader')

module.exports = {
	loaders: () => {
		return {
			UserTypeLoader: UserTypeLoader(),
			UserLoader: UserLoader()
		};
	},
};

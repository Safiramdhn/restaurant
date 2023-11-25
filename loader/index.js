const { UserTypeLoader } = require('../graphql/userTypes/user_type.loader');

module.exports = {
	loaders: () => {
		return {
			UserTypeLoader: UserTypeLoader(),
		};
	},
};

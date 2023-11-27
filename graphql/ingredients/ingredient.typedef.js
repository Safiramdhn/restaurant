const { gql } = require('apollo-server-express');

const IngredientTypedefs = gql`
	type Ingredient {
		name: String
		stock_amount: Int
		is_available: Boolean
		status: StatusEnum
		is_additional_ingredient: Boolean
		update_histories: [IngredientHistory]
	}

	type IngredientHistory {
		date: String
		user: User
	}

	input IngredientInput {
		name: String
		stock_amount: Int
		is_available: Boolean
		status: StatusEnum
		is_additional_ingredient: Boolean
	}
`;

module.exports = IngredientTypedefs;

const { gql } = require('apollo-server-express');

const IngredientTypedefs = gql`
	type Ingredient {
		name: String
		stock_amount: Int
		is_available: Boolean
		status: StatusEnum
		is_additional_ingredient: Boolean
	}

	input IngredientInput {
		name: String
		stock_amount: Int
		is_available: Boolean
		status: StatusEnum
		is_additional_ingredient: Boolean
	}

    extend type Query {
        GetAllIngredients(): [Ingredient]
        GetOneIngredient(_id: ID!): Ingredient
    }
`;

module.exports = IngredientTypedefs;

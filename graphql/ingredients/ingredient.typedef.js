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

	extend type Mutation {
		AddIngredient(ingredient_input: IngredientInput): Ingredient
		UpdateIngredient(_id: ID!, ingredient_input: IngredientInput): Ingredient
		DeleteIngredient(_id: ID!): String
	}
`;

module.exports = IngredientTypedefs;

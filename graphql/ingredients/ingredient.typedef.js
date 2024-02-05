const { gql } = require('apollo-server-express');

const IngredientTypedefs = gql`
	type Ingredient {
		_id: ID!
		name: String
		stock_amount: Int
		is_available: Boolean
		is_additional_ingredient: Boolean
		count_document: Int
	}

	input IngredientInput {
		name: String
		stock_amount: Int
		is_additional_ingredient: Boolean
	}

	input IngredientFilterInput {
		name: String
		is_available: String
		is_additional_ingredient: String
	}

	input Pagination {
		limit: Int
		page: Int
	}

	enum Sorting {
		asc
		desc
	}

	input IngredientSortingInput {
		name: Sorting
		stock: Sorting
	}

    extend type Query {
        GetAllIngredients(filter: IngredientFilterInput, pagination: Pagination, sorting: IngredientSortingInput): [Ingredient]
        GetOneIngredient(_id: ID!): Ingredient
    }

	extend type Mutation {
		AddIngredient(ingredient_input: IngredientInput): Ingredient
		UpdateIngredient(_id: ID!, ingredient_input: IngredientInput): Ingredient
		DeleteIngredient(_id: ID!): String
	}
`;

module.exports = IngredientTypedefs;

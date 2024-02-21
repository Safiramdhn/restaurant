const { gql } = require('apollo-server-express');

const IngredientTypedefs = gql`
	type Ingredient {
		_id: ID!
		name: String
		stock_amount: Int
		is_available: Boolean
		count_document: Int
	}

	input IngredientInput {
		name: String
		stock_amount: Int
	}

	input IngredientFilterInput {
		name: String
		is_available: String
	}

	input Pagination {
		limit: Int
		page: Int
	}

	enum SortingEnum {
		asc
		desc
	}

	input IngredientSortingInput {
		name: SortingEnum
		stock: SortingEnum
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

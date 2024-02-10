const { gql } = require('apollo-server-express');

const RecipeTypedefs = gql`
  type Recipe {
    _id: ID!
    name: String!
    available: Int
    is_published: Boolean
    status: StatusEnum
    price: Int
    is_discount: Boolean
    discount: Int
    is_best_seller: Boolean
    ingredient_details: [IngredientDetail]
    count_document: Int
  }

  type IngredientDetail {
    ingredient: ID
    stock_used: Int
  }

  input RecipeFilterInput {
    name: String
    publish_status: String
    discount_status: String
    best_seller: String
  }

  input RecipeSortingInput {
    name: SortingEnum
    price: SortingEnum
    discount_amount: SortingEnum
  }

  input RecipeInput {
    name: String
    price: Int
    ingredient_details: [IngredientDetailInput]
    is_discount: Boolean
    discount: Int
  }

  input IngredientDetailInput {
    ingredient: ID
    stock_used: Int
  }

  extend type Query {
    GetAllRecipes(filter: RecipeFilterInput, sorting: RecipeSortingInput, pagination: Pagination): [Recipe]
    GetOneRecipe(_id: ID): Recipe
  }

  extend type Mutation {
    CreateRecipe(recipe_input: RecipeInput): Recipe
    UpdateRecipe(_id: ID!, recipe_input: RecipeInput, publish_status: Boolean): Recipe
    DeleteRecipe(_id: ID!): String
  }
`;

module.exports = RecipeTypedefs;

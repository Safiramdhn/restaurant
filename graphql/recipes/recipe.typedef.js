const { gql } = require('apollo-server-express');

const RecipeTypedefs = gql`
  type Recipe {
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

  extend type Query {
    GetAllRecipes(filter: RecipeFilterInput, sorting: RecipeSortingInput, pagination: Pagination): [Recipe]
  }
`;

module.exports = RecipeTypedefs;

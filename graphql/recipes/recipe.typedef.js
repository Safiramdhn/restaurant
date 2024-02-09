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
    ingredient_details: [IngredientDetail]
  }

  type IngredientDetail {
    ingredient: ID
    stock_used: Int
  }
`;

module.exports = RecipeTypedefs;

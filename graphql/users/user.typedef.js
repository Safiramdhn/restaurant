const { gql } = require('apollo-server-express');

const UserTypedefs = gql`
  type User {
    _id: ID!
    username: String
    first_name: String
    last_name: String
    status: StatusEnum
    user_type: UserType
  }

  enum StatusEnum {
    active
    deleted
  }

  input UserInput {
    username: String
    password: String
    first_name: String
    last_name: String
    user_type: ID
  }

  type LoginUser {
    token: String!
  }

  input UserFilter {
    full_name: String
    user_type: ID
    username: String
  }

  input UserSorting {
    full_name: SortingEnum
    user_type: SortingEnum
    username: SortingEnum
  }

  extend type Query {
    GetAllUsers(filter: UserFilter, sorting: UserSorting, pagination: Pagination): [User]
    GetOneUser(_id: ID!): User
  }

  extend type Mutation {
    CreateUser(user_input: UserInput): User
    Login(username: String!, password: String!): LoginUser
    UpdateUser(_id: ID!, user_input: UserInput): User
    DeleteUser(_id: ID!): String
  }
`;

module.exports = UserTypedefs;

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

  extend type Query {
    GetAllUsers: [User]
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

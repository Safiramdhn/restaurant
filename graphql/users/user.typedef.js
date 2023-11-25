const { gql } = require('apollo-server-express');

const UserTypedefs = gql`
	type User {
		_id: ID!
		username: String
		first_name: String
		last_name: String
		civility: UserCivility
		gender: UserGender
		status: StatusEnum
		user_type_id: UserType
	}

	enum UserCivility {
		mr
		mrs
	}

	enum UserGender {
		male
		female
	}

	enum StatusEnum {
		active
		deleted
	}

	input UserInput {
		username: String!
		password: String!
		first_name: String
		last_name: String
		gender: UserGender
		user_type_id: ID
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
	}
`;

module.exports = UserTypedefs;

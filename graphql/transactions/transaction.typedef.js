const { gql } = require('apollo-server-express');

const TransactionTypedefs = gql`
  type Transaction {
    _id: ID!
    menus: [TransactionMenu]
    total_price: Int
    status: StatusEnum
    cashier: User
    payment_method: String
    transaction_status: TransactionStatusEnum
    queue_number: Int
    count_document: Int
  }

  type TransactionMenu {
    _id: ID
    recipe: Recipe
    amount: Int
    note: String
  }

  enum TransactionStatusEnum {
    in_cart
    pending
    paid
  }

  input TransactionFilterInput {
    transaction_date: TransactionDateEnum
    cashier: String
    payment_method: String
    transaction_status: TransactionStatusEnum
  }

  input TransactionSorting {
    transaction_date: SortingEnum
    total_price: SortingEnum
  }

  enum TransactionDateEnum {
    today
    yesterday
    last_week
    last_month
  }

  input TransactionInput {
    menus: [TransactionMenuInput]!
    payment_method: String
    transaction_status: TransactionStatusEnum
  }
  
  input TransactionMenuInput {
    _id: ID
    recipe: ID
    amount: Int
    note: String
    update_amount: Boolean
  }

  extend type Query {
    GetAllTransactions(filter: TransactionFilterInput, sorting: TransactionSorting, pagination: Pagination): [Transaction]
    GetOneTransaction(_id: ID): Transaction
  }

  extend type Mutation {
    CreateTransaction(transaction_input: TransactionInput): Transaction
    UpdateTransaction(_id: ID!, transaction_input: TransactionInput): String
    DeleteTransaction(_id: ID!): String
  }
`;

module.exports = TransactionTypedefs;

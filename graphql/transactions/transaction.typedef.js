const { gql } = require('apollo-server-express');

const TransactionTypedefs = gql`
  type Transaction {
    _id: ID!
    menus: [TransactionMenu]
    total_price: Int
    status: StatusEnum
    cashier: ID
    payment_method: String
    transaction_status: TransactionStatusEnum
    queue_number: Int
    count_document: Int
  }

  type TransactionMenu {
    recipe: ID
    amount: Int
    additional_ingredients: [ID]
    note: String
    total: Int
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

  extend type Query {
    GetAllTransactions(filter: TransactionFilterInput, sorting: TransactionSorting, pagination: Pagination): [Transaction]
    GetOneTransaction(_id: ID): Transaction
  }
`;

module.exports = TransactionTypedefs;

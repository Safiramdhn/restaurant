const { gql } = require('apollo-server-express');

const TransactionTypedefs = gql`
  type Transaction {
    _id: ID!
    transaction_time: TransactionTime
    menus: [TransactionMenu]
    total_price: Int
    status: StatusEnum
    cashier: ID
    payment_method: String
    transaction_status: TransactionStatusEnum
    queue_number: Int
  }

  type TransactionTime {
    date: String
    time: String
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
`;

module.exports = TransactionTypedefs;

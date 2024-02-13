const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TransactionSchema = new Schema(
  {
    menus: [
      {
        recipe: { type: Schema.ObjectId, ref: 'recipe' },
        amount: { type: Number },
        additional_ingredients: [{ type: Schema.ObjectId, ref: 'ingredient' }],
        note: { type: String },
        total: { type: Number },
      },
    ],
    total_price: { type: Number },
    status: { type: String, enum: ['active', 'deleted'] },
    cashier: { type: Schema.ObjectId, ref: 'user' },
    payment_method: { type: String },
    transaction_status: { type: String, enum: ['in_cart', 'pending', 'paid'] },
    queue_number: { type: Number },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('transactions', TransactionSchema);

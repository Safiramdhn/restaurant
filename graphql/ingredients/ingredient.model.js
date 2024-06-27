const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const IngredientSchema = new Schema(
  {
    name: { type: String, require: true, unique: true },
    stock_amount: { type: Number, default: 0 },
    is_available: { type: Boolean, default: false },
    status: { type: String, enum: ['active', 'deleted'], default: 'active' },
    update_histories: [
      {
        _id: false,
        date: { type: String },
        user: { type: Schema.ObjectId, ref: 'users' },
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('ingredients', IngredientSchema);

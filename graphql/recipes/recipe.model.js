const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const RecipeSchema = new Schema(
  {
    name: { type: String, require: true, unique: true },
    is_published: { type: Boolean, default: false },
    status: { type: String, enum: ['active', 'deleted'], default: 'active' },
    price: { type: Number, default: 0 },
    is_discount: { type: Boolean, default: false },
    discount: { type: Number, default: 0 },
    ingredient_details: [
      {
        ingredient: { type: Schema.ObjectId, ref: 'ingredients' },
        stock_used: { type: Number },
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('recipes', RecipeSchema);

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const IngredientSchema = new Schema({
    name: {type: String, require: true},
    stock_amount: {type: Number, default: 0},
    is_available: {type: Boolean},
    status: {type: String, enum: ['active', 'deleted'], default: 'active'},
    is_additional_ingredient: true,
    update_histories: [{
        date: {type: String},
        user_id: {type: mongoose.Schema.ObjectId, ref: 'users'}
    }]
},{
    timestamps: true
});

module.exports = mongoose.model('ingredients', IngredientSchema);
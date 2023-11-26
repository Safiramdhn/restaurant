const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema(
	{
		username: { type: String, unique: true, require: true },
		password: { type: String, require: true },
		first_name: { type: String, default: '' },
		last_name: { type: String, default: '' },
		civility: { type: String, enum: ['mr', 'mrs'] },
		gender: { type: String, enum: ['male', 'female'] },
		status: { type: String, enum: ['active', 'deleted'], default: 'active' },
		user_type: { type: mongoose.Schema.ObjectId, ref: 'user_types' },
	},
	{
		timestamps: true,
	}
);

module.exports = mongoose.model('users', UserSchema);
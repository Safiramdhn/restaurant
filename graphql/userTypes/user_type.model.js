const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserTypeSchema = new Schema(
	{
		name: { type: String },
		app_permission: {
			homepage: { type: Boolean, default: false },
			ingredients: {
				view: { type: Boolean, default: false },
				edit: { type: Boolean, default: false },
				add_button: { type: Boolean, default: false },
				delete: { type: Boolean, default: false },
			},
			recipes: {
				view: { type: Boolean, default: false },
				edit: { type: Boolean, default: false },
				add_button: { type: Boolean, default: false },
				delete: { type: Boolean, default: false },
				publish: { type: Boolean, default: false },
			},
			transactions: {
				view: {
					history: { type: Boolean, default: false },
					cart: { type: Boolean, default: false },
				},
				edit: { type: Boolean, default: false },
				add_button: { type: Boolean, default: false },
				delete: { type: Boolean, default: false },
			},
			users: {
				view: { type: Boolean, default: false },
				edit: { type: Boolean, default: false },
				add_button: { type: Boolean, default: false },
				delete: { type: Boolean, default: false },
			},
		},
	},
	{
		timestamps: true,
	}
);

module.exports = mongoose.model('user_types', UserTypeSchema);

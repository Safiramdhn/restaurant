const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

mongoose.connect('mongodb://' + process.env.DB_HOST +'/' + process.env.DB_NAME);

let db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error'));
db.once('open', function callback() {
	console.log('Database successfully connected');
});

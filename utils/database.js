const mongoose = require('mongoose');

mongoose.connect(
	'mongodb://' + process.env.DB_HOST + '/' + process.env.DB_NAME,
	{
		useNewUrlParse: true,
		useFindAndModify: false,
		useUnifiedTopology: true,
	}
);

let db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error'));
db.once('open', function callback() {
	console.log('Database successfully connected');
});

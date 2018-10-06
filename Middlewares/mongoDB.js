const mongoose = require('mongoose');
require('dotenv').config()
// mongodb://<dbuser>:<dbpassword>@ds115263.mlab.com:15263/heroku_c68z5q7j
const url = `mongodb://${process.env.MDB_USER}:${process.env.MDB_PASSWORD}@${process.env.MDB_HOST}/${process.env.MDB_DB}`;
exports.connectMongoDb = (req, res, next) => {
    if (mongoose.connection.readyState === 1) {
        return next();
    };
    mongoose.Promise = global.Promise;
    mongoose.connect(url, {
        useNewUrlParser: true,
        useCreateIndex: true,
    });
    const db = mongoose.connection;
    db.on('error', (error) => {
        next(error);
    });
    db.on('open', () => {
        console.log('im open')
        next();
    });
}
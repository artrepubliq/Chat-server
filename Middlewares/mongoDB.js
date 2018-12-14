require('dotenv').config()
const mongoose = require('mongoose');
const url = `mongodb://${process.env.MDB_USER}:${process.env.MDB_PASSWORD}@${process.env.MDB_HOST}/${process.env.MDB_DATABASE}`;
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
        next();
    });
}

exports.connectMongoSocket = () => {
    if (mongoose.connection.readyState === 1) {
        return;
    };
    mongoose.connect(url, {
        useNewUrlParser: true,
        useCreateIndex: true,
    });
    const db = mongoose.connection;
    return db;
    // db.on('error', (error) => {
    //     next(error);
    // });
    // db.on('open', () => {
    //     console.log('im open')
    //     next();
    // });
}
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
/**
 * this is a user schema
 */
const usersSchema = new Schema({
    user_name: {
        unique: true,
        required: true,
        type: String,
    },
    password: {
        type: String,
        required: true,
    },
    user_id: {
        type: String,
        required: true
    }
})

/* this is for create mongodb collection(table in general) based on created schema */
const usersModel = mongoose.model('users', usersSchema);

module.exports = { usersModel }
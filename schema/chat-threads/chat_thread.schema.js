const mongoose = require('mongoose');

const chat_thread_schema = new mongoose.Schema({

    created_time: {
        type: Date,
        require: true,
    },
    message: {
        type: String,
        require: true,
    },
    message_type: {
        required: true,
        type: String,
        default: 'text'
    },
    sender_id: {
        type: String,
        require: true,
    },
    receiver_id: {
        type: String,
        require: true,
    },
    visibility: {
        type: Boolean,
        require: true,
        default: true,
    },
    client_id: {
        required: true,
        type: String
    },
    status: {
        required: true,
        type: Number,
        default: -1
    },
    received_time: {
        required: false,
        type: Date
    },
    attachments: {
        required: false,
        type: String
    }
})

const chat_thread_model = mongoose.model('chat_threads', chat_thread_schema);

module.exports = { chat_thread_model };

const mongoose = require('mongoose');

const chat_thread_schema = new mongoose.Schema({

    created_time: {
        required: true,
        type: Date,
    },
    message: {
        required: true,
        type: String,
    },
    message_type: {
        required: true,
        type: String,
        default: 'text'
    },
    sender_id: {
        required: true,
        type: String,
    },
    receiver_id: {
        required: true,
        type: String,
    },
    visibility: {
        required: true,
        type: Boolean,
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

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
    read_receipts: {
        required: true,
        type: Boolean,
        default: false
    },
    attachments: {
        required: false,
        type: String
    }
})

const chat_thread_model = mongoose.model('chat_threads', chat_thread_schema);

module.exports = { chat_thread_model };

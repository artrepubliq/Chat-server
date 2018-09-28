const mongoose = require('mongoose');

const chat_thread_schema = new mongoose.Schema({
    conversation_id: {
        required: true,
        type: String,
    },
    message_threads: [
        {
            time: {
                type: String,
                require: true
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
            }
        }
    ],
})

const chat_thread_model = mongoose.model('chat_threads', chat_thread_schema);

module.exports = { chat_thread_model };
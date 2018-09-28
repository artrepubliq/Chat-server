const mongoose = require('mongoose');
const moment = require('moment');
const schema = mongoose.Schema;

const conversationSchema = new schema({

    client_id: {
        type: String,
        required: true
    },
    date: {
        required: true,
        type: String,
    },
    conversation_id: {
        type: String,
        required: true
    },
    conversation_thread_id: {
        type: String,
        required: true
    }
})

consversationModel = mongoose.model('conversation', conversationSchema);

module.exports = { consversationModel };
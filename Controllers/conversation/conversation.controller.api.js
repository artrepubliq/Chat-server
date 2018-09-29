const { chat_thread_model } = require('../../schema/chat-message/chat_message.schema');
const { consversationModel } = require('../../schema/converstion/conversation.schema');

const conversationApiController = {
    /**
     * read messages using @param conversation_id, @param client_id 
     */
    readMessageThreads: async (req, res, next) => {
        const { client_id, conversation_id, date } = { ...req.body }
        let conversation_thread_id;
        try {
            if (!client_id || !conversation_id || !date) {
                res.status(206).send({ error: true, result: 'Request paramenters are missing!' })
            } else {
                const conversationDetails = await consversationModel.findOne({ client_id, conversation_id, date });
                if (conversationDetails) {
                    conversation_thread_id = conversationDetails.conversation_thread_id;
                    const message_threads = await chat_thread_model.findOne({ _id: conversation_thread_id });
                    if (message_threads) {
                        res.status(200).send({ error: false, result: message_threads })
                    } else {
                        res.status(200).send({ error: false, result: 'No messages found' })
                    }
                } else {
                    res.status(200).send({ error: false, result: 'No conversations found' });
                }
            }
        } catch (error) {
            next(error);
        }
    }
}

module.exports = { conversationApiController }
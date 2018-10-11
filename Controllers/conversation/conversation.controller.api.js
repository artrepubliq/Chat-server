const { chat_thread_model } = require('../../schema/chat-threads/chat_thread.schema');
const { consversationModel } = require('../../schema/converstion/conversation.schema');

const conversationApiController = {
    /**
     * read messages using @param conversation_id, @param client_id 
     */

    readMessageThreads: async (req, res, next) => {
        const { client_id, sender_id, receiver_id, created_time } = { ...req.body };
        try {
            if (!client_id || !sender_id || !receiver_id || !created_time) {
                res.send({ error: false, result: 'Required parameters are missing!' })
            } else {
                let from_date = new Date(created_time);
                let to_date = new Date(`${created_time} 23:59:59`).setMinutes(330);
                to_date = new Date(to_date);
                const sender_messages = await chat_thread_model.find(
                    {
                        client_id,
                        $and: [
                            { receiver_id }, { sender_id }
                        ],
                        created_time: {
                            $gte: from_date,
                            $lt: to_date
                        },
                    }
                );
                const receiver_messages = await chat_thread_model.find(
                    {
                        client_id,
                        $and: [
                            { sender_id: receiver_id }, { receiver_id: sender_id }
                        ],
                        created_time: {
                            $gte: from_date,
                            $lt: to_date
                        },
                    }
                );
                let messages = [...sender_messages, ...receiver_messages];
                messages = messages.sort((a, b) => {
                    return new Date(a.created_time) - new Date(b.created_time);
                })
                res.send({ error: false, result: messages });
            }
        } catch (error) {
            next(error);
        }
    },

    testUpdateMessageReceipt: async (req, res, next) => {
        const { received_time, _id, client_id } = { ...req.body };
        try {
            const result = await chat_thread_model.updateMany(
                { _id: { $in: _id } },
                { $set: { read_receipts: true } },
                // { multi: true }
            );
            res.send(result);
        } catch (error) {
            next(error);
        }
    }
}

module.exports = { conversationApiController }
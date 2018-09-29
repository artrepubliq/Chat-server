const { chat_thread_model } = require('../../schema/chat-message/chat_message.schema');
const { consversationModel } = require('../../schema/converstion/conversation.schema');
const moment = require('moment');
const conversationController = {
    /**
     * @param messageObject takes @param message, @param receiver_name, @param sender_id, @param time as an object
     * and @param client_id for particular client
     */
    insertNewMessage: async (messageObject, client_id) => {

        try {
            let dateTime = new Date();
            dateTime = moment(dateTime).format("YYYY-MM-DD");
            const { message, receiver_id, sender_id, time, conversation_id } = { ...messageObject };
            /**
             * reading the conversations between the two users on the current date
             */
            const read_conversations = await consversationModel.find({
                conversation_id,
                client_id,
                date: dateTime
            });
            let chat_thread;
            /** 
            * Checks if there's any recorded conversation present on DB or not 
            * updates message_thread if there's recoded conversation, else
            * inserting new message_thread for the two users
            */
            if (read_conversations && read_conversations.length > 0) {
                console.log(read_conversations[0].conversation_thread_id, 22);
                const id = read_conversations[0].conversation_thread_id;
                chat_thread = await chat_thread_model.updateOne(
                    { _id: id },
                    {
                        "$push": {
                            message_threads: {
                                message, receiver_id, sender_id, time
                            }
                        }
                    });
            } else {
                chat_thread = await chat_thread_model.create({
                    conversation_id,
                    client_id,
                    date: dateTime,
                    message_threads: [{ message, receiver_id, sender_id, time }]
                });
                const insert_conversation = await consversationModel.create({
                    client_id,
                    conversation_id,
                    conversation_thread_id: chat_thread._id,
                    date: dateTime
                });
                return (insert_conversation);
            }
        } catch (error) {
            return error;
        }
    },
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
                        res.status(200).send({ error: true, result: 'No messages found' })
                    }
                } else {
                    res.status(200).send({ error: true, result: 'No conversations found' });
                }
            }
        } catch (error) {
            next(error);
        }
    }
}

module.exports = { conversationController };
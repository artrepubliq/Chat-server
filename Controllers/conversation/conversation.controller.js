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

            const { message, receiver_id, sender_id, time, conversation_id } = { ...messageObject }

            const read_conversations = await consversationModel.find({
                conversation_id,
                client_id,
                date: dateTime
            });
            console.log(read_conversations);
            let chat_thread;
            if (read_conversations && read_conversations.length > 0) {
                console.log(read_conversations[0].conversation_thread_id, 22);
                const id = read_conversations[0].conversation_thread_id;
                chat_thread = await chat_thread_model.findByIdAndUpdate({
                    _id: id,
                    $push: { message_threads: { message, receiver_id, sender_id, time } },
                }).exec();
                console.log(chat_thread);
            } else {
                chat_thread = await chat_thread_model.create({
                    conversation_id,
                    client_id,
                    date: dateTime,
                    message_threads: [{ message, receiver_id, sender_id, time }]
                })
            }

            const insert_conversation = await consversationModel.create({
                client_id,
                conversation_id,
                conversation_thread_id: chat_thread._id,
                date: dateTime
            });

            // console.log(insert_conversation);

            return new Promise((resolve, reject) => {
                resolve(messageObject);
            });
        } catch (error) {
            console.log(error);
        }

    }
}

module.exports = { conversationController };
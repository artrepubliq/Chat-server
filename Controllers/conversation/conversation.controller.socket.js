const { chat_thread_model } = require('../../schema/chat-threads/chat_thread.schema');
const { consversationModel } = require('../../schema/converstion/conversation.schema');
const moment = require('moment');
const conversationSocketController = {
    /**
     * @param messageObject takes @param message, @param receiver_name, @param sender_id, @param time as an object
     * and @param client_id for particular client
     */

    insert_new_message: async (messageObject, client_id) => {
        try {
            const { message, sender_id, receiver_id, created_time, message_type } = { ...messageObject };
            // console.log(created_time);
            if (!message || !sender_id || !receiver_id) {
                return false
            } else {
                const insert_message = await chat_thread_model.create({
                    message,
                    sender_id,
                    receiver_id,
                    created_time,
                    client_id,
                    message_type
                });
                return insert_message;
            }
        } catch (error) {
            console.log(error);
        }
    },
    /**
     * @param messageObject takes message object from recieves end to update status of message
     */
    updateMessageReceipt: async (messageObject, client_id, status) => {
        const { received_time, _id } = { ...messageObject };
        try {
            const result = await chat_thread_model.updateMany(
                { _id: { $in: _id } },
                { $set: { status, received_time } },
            );
            return result;
        } catch (error) {
            console.log(error);
        }
    }

    //     insertNewMessage: async (messageObject, client_id) => {

    //         try {
    //             let dateTime = new Date();
    //             dateTime = moment(dateTime).format("YYYY-MM-DD");
    //             const { message, receiver_id, sender_id, time, conversation_id } = { ...messageObject };
    //             /**
    //              * reading the conversations between the two users on the current date
    //              */
    //             const read_conversations = await consversationModel.find({
    //                 conversation_id,
    //                 client_id,
    //                 date: dateTime
    //             });
    //             let chat_thread;
    //             /** 
    //             * Checks if there's any recorded conversation present on DB or not 
    //             * updates message_thread if there's recoded conversation, else
    //             * inserting new message_thread for the two users
    //             */
    //             if (read_conversations && read_conversations.length > 0) {
    //                 // console.log(read_conversations[0].conversation_thread_id, 22);
    //                 const id = read_conversations[0].conversation_thread_id;
    //                 chat_thread = await chat_thread_model.updateOne(
    //                     { _id: id },
    //                     {
    //                         "$push": {
    //                             message_threads: {
    //                                 message, receiver_id, sender_id, time
    //                             }
    //                         }
    //                     });
    //             } else {
    //                 chat_thread = await chat_thread_model.create({
    //                     conversation_id,
    //                     client_id,
    //                     date: dateTime,
    //                     message_threads: [{ message, receiver_id, sender_id, time }]
    //                 });
    //                 const insert_conversation = await consversationModel.create({
    //                     client_id,
    //                     conversation_id,
    //                     conversation_thread_id: chat_thread._id,
    //                     date: dateTime
    //                 });
    //                 return (insert_conversation);
    //             }
    //         } catch (error) {
    //             return error;
    //         }
    //     }
}

module.exports = { conversationSocketController };
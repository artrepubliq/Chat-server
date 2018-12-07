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
            if (!message || !sender_id || !receiver_id) {
                return false;
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
    },

    /**
     * this is to  delete message for a user by ID
     */
    delete_message_by_message_id: async (deleteMessageObject) => {
        const { _id, deleted_from, deleted_to, status, deleted_by } = deleteMessageObject;
        let result;
        console.log(deleteMessageObject);
        try {
            const message = await chat_thread_model.find({
                $and: [
                    { _id }, { deleted_by: deleted_to }
                ]
            });
            if (message && message.length > 0) {
                result = await chat_thread_model.updateOne(
                    { _id },
                    { $set: { deleted_by: '0' } }
                )
            } else {
                result = await chat_thread_model.updateOne(
                    { _id },
                    { $set: { deleted_by } }
                )
            }
            return result;
        } catch (error) {
            console.log(error);
        }
    },

    /**
     * this is to update the message text for a message Id
     */
    updateMessageById: async (messageObject) => {
        const { _id, message, created_time } = messageObject;
        try {
            const result = await chat_thread_model.updateOne(
                { _id },
                { $set: { message, created_time } }
            );
            return result;
        } catch (error) {
            console.log(error);
        }
    }

}

module.exports = { conversationSocketController };
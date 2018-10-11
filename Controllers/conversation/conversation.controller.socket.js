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
        // console.log(deleteMessageObject);
        const { _id, sender_id, receiver_id, status, deleted_by } = deleteMessageObject;
        console.log({ _id, sender_id, receiver_id, status, deleted_by });
        let result;
        try {
            console.log(deleted_by);
            const message = await chat_thread_model.find({
                $and: [
                    { _id }, { deleted_by: receiver_id }
                ]
            });
            if (message && message.length > 0) {
                console.log(message,61)
                result = await chat_thread_model.updateOne(
                    { _id },
                    { $set: { deleted_by: '0' } }
                )
            } else {
                console.log(message, 'in else')
                result = await chat_thread_model.updateOne(
                    { _id },
                    { $set: { deleted_by } }
                )
            }
            return result;
        } catch (error) {
            console.log(error);
        }
    }

}

module.exports = { conversationSocketController };
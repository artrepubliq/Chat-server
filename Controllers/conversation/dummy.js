const { chat_thread_model } = require('../../schema/chat-threads/chat_thread.schema');
const { consversationModel } = require('../../schema/converstion/conversation.schema');
var moment = require('moment');
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
                let from_date = new Date(created_time).toISOString();
                let to_date = new Date(`${created_time} 23:59:59`).setMinutes(330);
                to_date = new Date(to_date);
                let conversationObject;
                conversationObject = await conversationApiController.getLatestMessagesFromDatabase(client_id, receiver_id, sender_id, from_date, to_date);
                if (conversationObject.sender_messages.length > 0 || conversationObject.receiver_messages.length > 0) {
                    let messages = [...conversationObject.sender_messages, ...conversationObject.receiver_messages];
                    messages = messages.sort((a, b) => {
                        return new Date(a.created_time) - new Date(b.created_time);
                    })
                    console.log('first attemt');
                    res.send({ error: false, result: messages });
                } else {
                    const lastConversation = await conversationApiController.getLastLatestConversationFromDB(client_id, receiver_id, sender_id)
                    if (lastConversation.sender_messages.length <= 0 || lastConversation.receiver_messages.length <= 0) {
                        console.log('test');
                        res.send({ error: false, result: [] });
                    } else {

                        let to_new_date = lastConversation.sender_messages.length > 0 ? lastConversation.sender_messages[0].created_time : lastConversation.receiver_messages[0].created_time;
                        console.log(moment(to_new_date).format('YYYY-MM-DD'));

                        let to_t_date = new Date(`${moment(to_new_date).format('YYYY-MM-DD')} 23:59:59`).setMinutes(330);
                        to_t_date = new Date(to_t_date).toISOString();
                        console.log(to_t_date);
                        conversationObject = await conversationApiController.getLatestMessagesFromDatabase(client_id, receiver_id, sender_id, from_date, to_t_date);
                        let messages = [...conversationObject.sender_messages, ...conversationObject.receiver_messages];
                        messages = messages.sort((a, b) => {
                            return new Date(a.created_time) - new Date(b.created_time);
                        })
                        console.log(messages, 39);
                        res.send({ error: false, result: messages });
                    }
                }
            }
        } catch (error) {
            next(error);
        }
    },

    /**
     * get latest messages from database
     */
    getLatestMessagesFromDatabase(client_id, receiver_id, sender_id, from_date, to_date) {
        return new Promise(
            async (resolve, reject) => {
                console.log(new Date(from_date).toISOString(), new Date(to_date).toISOString());
                // const ttt = await chat_thread_model.find({}).sort({ _id: -1 }).limit(1)
                // console.log(ttt, 46);
                const sender_messages = await chat_thread_model.find(
                    {
                        client_id,
                        $and: [
                            { receiver_id }, { sender_id }
                        ],
                        deleted_by: { $nin: [sender_id, '0'] },
                        created_time: {
                            $lt: new Date(from_date).toISOString(),
                            $gte: new Date(to_date).toISOString()
                        },
                    }
                );
                const receiver_messages = await chat_thread_model.find(
                    {
                        client_id,
                        $and: [
                            { sender_id: receiver_id }, { receiver_id: sender_id }
                        ],
                        deleted_by: { $nin: [sender_id, '0'] },
                        created_time: {
                            $lt: new Date(from_date).toISOString(),
                            $gte: new Date(to_date).toISOString()
                        },
                    }
                );
                resolve({ sender_messages, receiver_messages });
            });
    },
    getLastLatestConversationFromDB(client_id, receiver_id, sender_id) {
        return new Promise(
            async (resolve, reject) => {
                // const ttt = await chat_thread_model.find({}).sort({ _id: -1 }).limit(1)
                const sender_messages = await chat_thread_model.find(
                    {
                        client_id,
                        $and: [
                            { receiver_id }, { sender_id }
                        ],
                        deleted_by: { $nin: [sender_id, '0'] }
                    }
                ).sort({ _id: -1 }).limit(1);
                const receiver_messages = await chat_thread_model.find(
                    {
                        client_id,
                        $and: [
                            { sender_id: receiver_id }, { receiver_id: sender_id }
                        ],
                        deleted_by: { $nin: [sender_id, '0'] }
                    }
                ).sort({ _id: -1 }).limit(1);
                resolve({sender_messages, receiver_messages});
            });
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
    },

    /**
     * GET UN-READ CONVERSATIONS BY USERID
     */
    getUnReadMessagesByUserId: async (req, res, next) => {
        const { client_id, receiver_id } = req.body;
        try {
            if (!client_id || !receiver_id) {
                res.send({ error: false, result: 'Required Parameters are missing!!!' });
            } else {
                const unread_messagesData = await chat_thread_model.find(
                    {
                        client_id,
                        receiver_id,
                        status: { $nin: [1] }
                    },
                    'message_type _id message sender_id receiver_id created_time');
                // const unread_messages = await chat_thread_model.count(
                //     {
                //         client_id,
                //         receiver_id,
                //         status: { $nin: [1] }
                //     }
                // );
                res.send({ error: false, result: unread_messagesData });
            }
        } catch (error) {
            next(error);
        }
    }

}

module.exports = { conversationApiController }
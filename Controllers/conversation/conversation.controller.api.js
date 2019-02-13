const { chat_thread_model } = require('../../schema/chat-threads/chat_thread.schema');
const { consversationModel } = require('../../schema/converstion/conversation.schema');
const jwt = require('jsonwebtoken');
const conversationApiController = {
    /**
     * read messages using @param conversation_id, @param client_id 
     */

    readMessageThreads: async (req, res, next) => {
        const { client_id, sender_idd, receiver_id, created_time } = { ...req.body };

        // sender_id is the ID of the currently loggedIn user
        // receiverID is the ID of the user with whom the currently loggedIn user is talking to
        console.log("JSON WebToken ###",process.env.JWT_KEY)
        try {
            if (req.headers.authorization) {
                const verfyJwt = jwt.verify(req.headers.authorization, process.env.JWT_KEY);
                console.log(verfyJwt, 'verfyJwt');
                const sender_id  = verfyJwt.user_id;
                const client_id  = verfyJwt.client_id;
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
                            deleted_by: { $nin: [sender_id, '0'] },
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
                            deleted_by: { $nin: [sender_id, '0'] },
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
            } else {
                let from_date = new Date(created_time);
                let to_date = new Date(`${created_time} 23:59:59`).setMinutes(330);
                to_date = new Date(to_date);  
                messages = await conversationApiController.readMesageThreadsFromDB(client_id, sender_id, receiver_id, created_time, from_date, to_date);
                if (messages.length <= 0) {
                    messages = await conversationApiController.readOlderMesageThreadsFromDB(client_id, sender_id, receiver_id);
                    res.send({ error: false, result: messages });
                } else if (messages.length < 10) {
                    messages = await conversationApiController.readOlderMesageThreadsFromDB(client_id, sender_id, receiver_id);
                    res.send({ error: false, result: messages });
                } else {
                    res.send({ error: false, result: messages });
                }
            }
        } catch (error) {
            next(error);
        }
    },

    readMesageThreadsFromDB: (client_id, sender_id, receiver_id, created_time, from_date,to_date) => {
        return new Promise( async (resolve, reject) =>  {
            const sender_messages = await chat_thread_model.find(
                {
                    client_id,
                    $and: [
                        { receiver_id }, { sender_id }
                    ],
                    deleted_by: { $nin: [sender_id, '0'] },
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
                    deleted_by: { $nin: [sender_id, '0'] },
                    created_time: {
                        $gte: from_date,
                        $lt: to_date
                    },
                }
            );
            let messages = [...sender_messages, ...receiver_messages];
            messages = messages.sort((a, b) => {
                return new Date(a.created_time) - new Date(b.created_time);
            });
            resolve(messages);
        });
    },

    readOlderMesageThreadsFromDB: (client_id, sender_id, receiver_id) => {
        return new Promise( async (resolve, reject) =>  {
            const sender_messages = await chat_thread_model.find(
                {
                    client_id,
                    $and: [
                        { receiver_id }, { sender_id }
                    ],
                    deleted_by: { $nin: [sender_id, '0'] }
                }
            ).sort({created_time:-1}).limit(15);
            const receiver_messages = await chat_thread_model.find(
                {
                    client_id,
                    $and: [
                        { sender_id: receiver_id }, { receiver_id: sender_id }
                    ],
                    deleted_by: { $nin: [sender_id, '0'] }
                }
            ).sort({created_time:-1}).limit(15);;
            let messages = [...sender_messages, ...receiver_messages];
            messages = messages.sort((a, b) => {
                return new Date(a.created_time) - new Date(b.created_time);
            });
            resolve(messages);
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
        console.log(req.body);
        // receiver_id is the ID of the currently loggedIn user
        
        try {
            if (req.headers.authorization) {
                const verfyJwt = jwt.verify(req.headers.authorization, process.env.JWT_KEY);
                console.log(verfyJwt, 'verfyJwt');
                const client_id = verfyJwt.client_id;
                const receiver_id = verfyJwt.user_id;
            console.log(client_id);
            console.log(receiver_id);
                if (!client_id || !receiver_id) {
                    res.send({ error: false, result: 'Required Parameters are missing!!!' });
                } else {
                    const unread_messages = await chat_thread_model.find(
                        {
                            client_id,
                            receiver_id,
                            status: { $nin: [1] }
                        }
                    );
                    if (!unread_messages) {
                        unread_messages = [];
                    }
                    res.send({ error: false, result: unread_messages });
                }
            } else {
                res.send({ error: false, result: 'Required parameters are missing!' })
            }

        } catch (error) {
            next(error);
        }
    }

}

module.exports = { conversationApiController }

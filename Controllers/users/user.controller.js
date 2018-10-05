const { usersModel } = require('../../schema/users/users');
const { handleError } = require('../../Middlewares/handleErrors')
const { chat_thread_model } = require('../../schema/chat-threads/chat_thread.schema');

const usersController = {
    /**
     * this is to get the list of users
     */
    getUsers: async (req, res, next) => {
        try {
            const userData = await usersModel.find({});
            res.status(200).send({ result: userData, error: false });
        } catch (error) {
            handleError(error, req, res);
        }
    },

    /**
     * this is to get the count of messages for the user who he'd communicated with
     */
    getCount: async (req, res, next) => {
        try {
            const userData = await usersModel.find({});
            const { client_id, created_time } = { ...req.body };
            const receiver_id = req.body.user_id;

            let from_date = new Date(created_time);
            let to_date = new Date(`${created_time} 23:59:59`).setMinutes(330);
            to_date = new Date(to_date);

            const sender_ids = userData.reduce((sender_id, users) => [...sender_id, users.user_id], []);
            if (sender_ids && sender_ids.length > 0) {
                let indexOfReceiver_id = sender_ids.indexOf(receiver_id);
                if (indexOfReceiver_id > 0) {
                    sender_ids.splice(indexOfReceiver_id, 1)
                }
            }
            const userConversations = await chat_thread_model.find({
                client_id,
                receiver_id,
                sender_id: { $in: sender_ids },
                status: -1,
                created_time: {
                    $gte: from_date,
                    $lt: to_date
                },
            });
            const message_ids = userConversations.reduce((cumul, conversation) => [...cumul, conversation._id], []);
            const updateMessageStatus = await chat_thread_model.updateMany(
                { _id: { $in: message_ids } },
                { status: 0 }
            );
            let notification = [];
            userData.map((user_details, index) => {
                let userObject = {};
                let notification_count = userConversations.filter(conversation => conversation.sender_id === user_details.user_id).length;
                userObject['_id'] = user_details._id;
                userObject['user_id'] = user_details.user_id;
                userObject['user_name'] = user_details.user_name;
                userObject['notifications'] = notification_count;
                notification = [...notification, userObject];
            });
            res.status(200).send({ result: notification, error: false });
        } catch (error) {
            handleError(error, req, res);
        }
    },
}

module.exports = { usersController }
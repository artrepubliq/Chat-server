const express = require('express');
const app = express();
const http = require('http');
const bodyParser = require('body-parser');
const { connectMongoDb } = require('../Middlewares/mongoDB');
const handleErrors = require('../Middlewares/handleErrors');
const awsUpload   = require('../Middlewares/AWSUpload');
const { uploadFileRouter } = require('../Controllers/AWSUploadController');

require('dotenv').config();
const cors = require('cors');

const { userRouter } = require('../Controllers/users');
const { conversationSocketController } = require('../Controllers/conversation/conversation.controller.socket');
const { conversationsRouter } = require('../Controllers/conversation');
const { connectMongoSocket } = require('../Middlewares/mongoDB')

// const mongoose = require('mongoose');
// const url = `mongodb://${process.env.MDB_USER}:${process.env.MDB_PASSWORD}@${process.env.MDB_HOST}/${process.env.MDB_DB}`;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use('/uploadfile', uploadFileRouter);

const server = http.createServer(app);
app.get('/', (req, res) => {
    res.send({ status: true, });
});
app.use(connectMongoDb);
app.use(handleErrors.responeseTime);
app.use('/users', connectMongoDb, userRouter)
app.use('/conversations', connectMongoDb, conversationsRouter);

const io = require('socket.io')(server);
let clients = {};
let users = {};

connectMongoSocket();
/**
 * @param privatechat is the namespace for single user chat.
 * @param client_id takes client id from the query string.
 */
const privateChat = io.of('privatechat').on('connection', socket => {

    console.log(`private chat users/sockets connected : ${Object.keys(io.sockets.connected).length}`);
    socket.emit('connection', { status: true, data: 'socket connected successfully' });
    updateClientUsers = (client_id) => {
        let user_ids = [];
        Object.keys(clients[client_id]).map(user_socket => {
            let user_id = clients[client_id][user_socket].user_id;
            let socket_key = user_socket;
            user_ids = [...user_ids, { user_id, socket_key }];
        });
        io.of('privatechat').to(client_id).emit('new_users', { logged_in_users: user_ids });
    }

    /**
     * this is to add a new user and emit to every user who is listening in private chat namespace.
     * @param client_id takes client_id as key to certain client sockets.
     * @param user_socket takes user socket object, that will be nested inside the client object.
     */
    updateClients = (client_id, user_socket) => {
        if (Object.keys(clients).length === 0) {
            clients[client_id] = { ...user_socket }
        } else {
            clients[client_id] = { ...clients[client_id], ...user_socket }
        }
    }

    /**
     * this listens on new user_login event occured
     * @param user_login
     */
    socket.on('user_login', (userData) => {
        let users = {};
        if (socket.handshake.query.client_id) {
            let client_id = socket.handshake.query.client_id;
            socket.client_id = socket.handshake.query.client_id;
            socket.user_name = userData.user_name;
            socket.user_id = userData.user_id;
            users[`${userData._id}_${client_id}`] = socket;
            updateClients(client_id, users);
            socket.join(client_id, () => {
                updateClientUsers(client_id);
            });
        }
    });

    /**
     * this listens on new Message
     * @param send_new_message
     */
    socket.on('send_new_message', async (messageData) => {
        try {
            let client_id = socket.handshake.query.client_id;
            if (client_id) {
                const result = await conversationSocketController.insert_new_message(messageData, client_id);
                socket.emit('new_message_stored_in_db_confirm', result);
                if (clients[client_id] &&
                    clients[client_id][messageData.socket_key]) {

                    clients[client_id][messageData.socket_key].emit('receive_new_message', result);
                } else {
                    return;
                }
            } else {
                return
            }
        }
        catch (error) {
            console.log(error)
        }
    });

    /**
     * this listens on user typing
     * @param user_typeing
     */
    socket.on('user_typing_emit', async (userData) => {
        try {
            let client_id = socket.handshake.query.client_id;
            if (client_id) {
                if (clients[client_id] &&
                    clients[client_id][userData.socket_key]) {
                    clients[client_id][userData.socket_key].emit('user_typing_listener', { user_id: userData.user_id });
                } else {
                    return;
                }
            } else {
                return
            }
        }
        catch (error) {
            console.log(error)
        }
    });

    /**
     * @param messageData takes the message id object details for receiver read confirmation
     */
    socket.on('message_read_confirm_from_receiver', async (messageData) => {
        let client_id = socket.handshake.query.client_id;
        if (client_id) {
            if (clients[client_id] &&
                clients[client_id][messageData.socket_key]) {
                const updateResult = await conversationSocketController.updateMessageReceipt(messageData, client_id, 1);
                clients[client_id][messageData.socket_key].emit('message_read_confirm_to_sender',
                    { _id: messageData._id, user_id: messageData.user_id });
            } else {
                return;
            }
        } else {
            return
        }

    });

    /**
     * @param messageData takes the message id object details for receiver confirmation
     */
    socket.on('message_received_confirm_from_receiver', async (messageData) => {
        let client_id = socket.handshake.query.client_id;
        if (client_id) {
            if (clients[client_id] &&
                clients[client_id][messageData.socket_key]) {
                const updateResult = await conversationSocketController.updateMessageReceipt(messageData, client_id, 0);
                clients[client_id][messageData.socket_key].emit('message_received_confirm_to_sender',
                    { _id: messageData._id, user_id: messageData.user_id });
            } else {
                return;
            }
        } else {
            return
        }

    });

    /**
     * @param disconnect_private_chat_socket triggs when user wants to disconnect the connection
     */
    socket.on('disconnect_private_chat_socket', (socketData) => {
        let client_id = socket.handshake.query.client_id;
        if (client_id) {
            console.log(socketData.socket_key, 96);
            if (clients[client_id][socketData.socket_key]) {
                delete clients[client_id][socketData.socket_key];
                updateClientUsers(client_id);
            } else {
                return;
            }
        } else {
            return;
        }
    });

    /**
     * this is to delete users old messages
     */
    socket.on('delete_old_message', async (messageObject) => {
        let client_id = socket.handshake.query.client_id;
        if (messageObject.status === 'true') {
            try {
                messageObject['deleted_by'] = '0';
                const result = await conversationSocketController.delete_message_by_message_id(messageObject, client_id)
                clients[client_id][messageObject.sender_socket_key].emit('delete_old_message_succes_listener', messageObject);
                clients[client_id][messageObject.receiver_socket_key].emit('delete_old_message_succes_listener', messageObject);
            } catch (error) {
                console.log(error);
            }
        } else {
            // update query has to be here.
            messageObject['deleted_by'] = messageObject.deleted_from;
            const result = await conversationSocketController.delete_message_by_message_id(messageObject, client_id)
            clients[client_id][messageObject.sender_socket_key].emit('delete_old_message_succes_listener', messageObject);
        }
    });

    /**
     * 
     */
    socket.on('update_sender_old_message_emit', async (messageObject) => {
        let client_id = socket.handshake.query.client_id;
        if (client_id) {
            if (clients[client_id] &&
                clients[client_id][messageObject.receiver_socket_key]) {
                const result = await conversationSocketController.updateMessageById(messageObject, client_id);
                if(result.nModified === 1){
                    messageObject['updated'] = true;
                } else {
                    messageObject['updated'] = false;
                }
                clients[client_id][messageObject.receiver_socket_key].emit('update_sender_old_message_listen', messageObject);
                socket.emit('update_sender_old_message_listen', messageObject);
            } else {
                return;
            }
        } else {
            return;
        }

    });

    /********************************* SOCKET R&D ************************************/
    socket.on('new user', data => {
        console.log(data);
        if (data in users) {
            return;
        } else {
            socket.nickName = data;
            users[socket.nickName] = socket;
            updateNickNames();
        }
    });
    /**
     * this is to send a message to a socket if a user is listed in users 
     */
    socket.on('sendmessage', (data) => {
        console.log(data, 76);
        if (data.nickname in users) {
            // io.of('privatechat').emit('new message', { message: data, nickname: socket.nickname });
            users[data.nickname].emit('new message', { message: data, nickname: socket.nickname });
        }
    });
    /**
     * this to create chat room
     */
    socket.on('disconnect', data => {
        if (!socket.nickname) return;
        delete users[socket.nickname];
        updateNickNames();
    });
});

io.of('groupchat').on('connection', (socket) => {
    socket.on('join', data => {
        console.log(`join room invoked`);
        socket.join(data.room);
        socket.emit('rooms', `A new user has joined the room ${data.room}`);
    });

});

app.use(handleErrors.handle404Error);
app.use(handleErrors.handleError);

const port = process.env.PORT || 3000;
server.listen(port, () => {
    console.log(`Im listening on ${process.env.NODE_ENV} environment with port ${server.address().port}`);
})
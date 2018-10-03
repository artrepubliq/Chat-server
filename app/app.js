const express = require('express');
const app = express();
const http = require('http');
const bodyParser = require('body-parser');
const { connectMongoDb } = require('../Middlewares/mongoDB');
const handleErrors = require('../Middlewares/handleErrors');
require('dotenv').config();
const cors = require('cors');

const { userRouter } = require('../Controllers/users');
const { conversationSocketController } = require('../Controllers/conversation/conversation.controller.socket');
const { conversationsRouter } = require('../Controllers/conversation');
const moment = require('moment');

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

const server = http.createServer(app);
app.get('/', (req, res) => {
    res.send({ status: true, });
});

app.use(handleErrors.responeseTime);
app.use('/users', connectMongoDb, userRouter)
app.use('/conversations', connectMongoDb, conversationsRouter);

const io = require('socket.io')(server);
let clients = {};
let users = {};

/**
 * @param privatechat is the namespace for single user chat.
 * @param client_id takes client id from the query string.
 */
io.of('privatechat').on('connection', socket => {
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
        let users = {}
        socket.client_id = socket.handshake.query.client_id;
        socket.user_name = userData.user_name;
        socket.user_id = userData.user_id;
        users[`${userData._id}_${socket.handshake.query.client_id}`] = socket;
        updateClients(socket.handshake.query.client_id, users);
        socket.join(socket.handshake.query.client_id, () => {
            updateClientUsers(socket.handshake.query.client_id);
        });
    });

    /**
     * this listens on new Message
     * @param send_new_message
     */
    socket.on('send_new_message', async (messageData) => {
        try {
            // console.log(messageData.socket_key, 85)
            // console.log('-----------------------------------------------')
            if (clients[socket.handshake.query.client_id] &&
                clients[socket.handshake.query.client_id][messageData.socket_key]) {
                const result = await conversationSocketController.insert_new_message(messageData, socket.handshake.query.client_id);
                clients[socket.handshake.query.client_id][messageData.socket_key].emit('receive_new_message', result);
            } else {
                return;
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
            if (clients[socket.handshake.query.client_id] &&
                clients[socket.handshake.query.client_id][userData.socket_key]) {
                clients[socket.handshake.query.client_id][userData.socket_key].emit('user_typing_listener', userData);
                socket.emit('user_typing_emit_confirmation', true);
            } else {
                return;
            }
        }
        catch (error) {
            console.log(error)
        }
    });

    /**
     * @param disconnect_private_chat_socket triggs when user wants to disconnect the connection
     */
    socket.on('disconnect_private_chat_socket', (socketData) => {
        console.log(socketData.socket_key, 96);
        if (clients[socket.handshake.query.client_id][socketData.socket_key]) {
            delete clients[socket.handshake.query.client_id][socketData.socket_key];
            updateClientUsers(socket.handshake.query.client_id);
        } else {
            return;
        }

    })







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
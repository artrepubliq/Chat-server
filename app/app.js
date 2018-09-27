const express = require('express');
const app = express();
const http = require('http');
const bodyParser = require('body-parser');
const { connectMongoDb } = require('../Middlewares/mongoDB');
const handleErrors = require('../Middlewares/handleErrors');
const { userRouter } = require('../Controllers/users')
require('dotenv').config();
const cors = require('cors');

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

const server = http.createServer(app);
app.get('/', connectMongoDb, (req, res) => {
    res.send({ status: true, });
});

app.use('/users', connectMongoDb, userRouter)
app.use(handleErrors.handleError);
const io = require('socket.io')(server);
let clients = {};
let users = {};

io.of('privatechat').on('connection', socket => {

    console.log('private chat');
    updateNickNames = () => {
        io.of('privatechat').emit('usernames', Object.keys(users));
    }
    /**
     * this is to add a new user and emit to every user who is listening in private chat namespace
     */

    updateClients = (client_id, user_socket) => {
        if (Object.keys(clients).length === 0) {
            clients[client_id] = { ...user_socket }
        } else {
            console.log('im not empty');
            clients[client_id] = { ...clients[client_id], ...user_socket }
        }
    }
    socket.on('user_login', (userData) => {

        let users = {}
        socket.client_id = socket.handshake.query.client_id;
        socket.user_name = userData.user_name;
        socket.user_id = userData.user_id;
        users[`${userData._id}_${socket.handshake.query.client_id}`] = socket;

        updateClients(socket.handshake.query.client_id, users);

        socket.join(socket.handshake.query.client_id, () => {
            let user_ids = [];
            Object.keys(clients[socket.handshake.query.client_id]).map(user_socket => {
                let user_id = clients[socket.handshake.query.client_id][user_socket].user_id;
                let socket_key = user_socket;
                user_ids = [...user_ids, { user_id, socket_key }];
            });
            io.of('privatechat').to(socket.handshake.query.client_id).emit('new_users', { logged_in_users: user_ids });
        });
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

app.use((req, res) => {
    res.status(404).send({ status: 404, data: 'URL not found' });
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
    console.log(`Im listening on ${process.env.NODE_ENV} environment with port ${server.address().port}`);
})
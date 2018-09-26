const express = require('express');
const app = express();
const http = require('http');
const bodyParser = require('body-parser');
const connectMongoDb = require('../Middlewares/mongoDB').connectMongoDb;
const handleErrors = require('../Middlewares/handleErrors')
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
require('dotenv').config();
const server = http.createServer(app);


app.get('/', connectMongoDb, (req, res) => {
    console.log('im requested');
    res.send({ hi: 'hi' });
});

app.post('/hi', (req, res) => {
    console.log(req.body);
    res.send({ data: req.body })
});

app.use(handleErrors.handleError);
const io = require('socket.io')(server);
let users = {};
io.of('/chat').on('connection', (socket) => {
    socket.on('newMessage', (data) => {
        console.log(`new message recieved from the user ${data.user_name}: ${data.message} `)
        socket.broadcast.emit('newMessage', data);
    });


});

io.of('privatechat').on('connection', socket => {
    console.log('private chat');
    updateNickNames = () => {
        io.of('privatechat').emit('usernames', Object.keys(users));
    }
    /**
     * this is to add a new user and emit to every user who is listening in private chat namespace
     */
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
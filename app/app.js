const express = require('express');
const app = express();
const http = require('http');
const bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
const server = http.createServer(app);

app.get('/', (req, res) => {
    console.log('im requested');
    res.on('finish', () => {
        console.log('im invoked');
    })
    res.send({ hi: 'hi' });
});

app.post('/hi', (req, res) => {
    console.log(req.body);
    res.send({ data: req.body })
});

app.use((req, res) => {
    res.status(404).send({ status: 404, data: 'URL not found' });
});
const io = require('socket.io')(server);

/**
 * this is to create rooms
 */
// const getRooms = ['keerthan', 'ajay', 'maheshwar'];
// io.on('connection', (socket) => {
//     // console.log(socket);
//     console.log('im called');
//     socket.emit('connection', { is_connected: true, socket_id: socket.id });
//     socket.on('joinRoom', (room) => {
//         console.log(socket.rooms)
//         if (getRooms.includes(room)) {
//             socket.join(room);
//             // console.log(socket);
//             return socket.emit('success', `you have successfully joined room ${room}`);
//         } else {
//             return socket.emit('err', 'no room is there for joining');
//         }
//     });
// })
let users = {};
io.of('/chat').on('connection', (socket) => {
    console.log('im called')
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

    socket.on('sendmessage', (data) => {
        console.log(data, 76);
        if (data.nickname in users) {
            // io.of('privatechat').emit('new message', { message: data, nickname: socket.nickname });
            users[data.nickname].emit('new message', { message: data, nickname: socket.nickname });
        }
    });

    socket.on('disconnect', data => {
        if (!socket.nickname) return;
        delete users[socket.nickname];
        updateNickNames();
    });
})

const port = process.env.PORT || 3000;
server.listen(port, () => {
    console.log(`Im listening on ${process.env.NODE_ENV} environment with port ${server.address().port}`);
})
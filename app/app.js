const amqp = require('amqp');
const express = require('express');
const app = express();
const http = require('http');
const bodyParser = require('body-parser');
const handleErrors = require('../Middlewares/handleErrors');
const awsUpload = require('../Middlewares/AWSUpload');
const { uploadFileRouter } = require('../Controllers/AWSUploadController');
const { connectMongoDb } = require('../Middlewares/mongoDB');
const util = require('util');
require('dotenv').config();
const cors = require('cors');
const { userRouter } = require('../Controllers/users');
const { conversationSocketController } = require('../Controllers/conversation/conversation.controller.socket');
const { conversationsRouter } = require('../Controllers/conversation');
const { connectMongoSocket } = require('../Middlewares/mongoDB');
const frameguard = require('frameguard');

var corsOptions = {
  origin: function (origin, callback) {
    try {
      if (origin.includes("flujo.io") || origin.includes("localhost") || origin.includes("appknox")) {
        callback(null, true)
      } else {
        callback(new Error('Not allowed by CORS'))
      }
    }
    catch (e) {
      callback(null, false)
    }
  }
}
  app.options(cors(corsOptions));
  app.use(cors(corsOptions));
app.use(frameguard({ action: 'deny' }))

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use('/uploadfile', uploadFileRouter);
const server = http.createServer(app);
app.use(connectMongoDb);
app.use(handleErrors.responeseTime);
app.use('/users', connectMongoDb, userRouter)
app.use('/conversations', connectMongoDb, conversationsRouter);
const uuid4 = require('uuid4');

const io = require('socket.io')(server);
// const rabbitMQHandler = require('./rabbitmq');
// const messageHandler = require('./messages');
const amqp_adapter = require('socket.io-amqp');
const opts = {
    queueName: '',
    channelSeperator: '#',
    prefix: 'flujo',
    useInputExchange: false
}
io.adapter(amqp_adapter('amqp://ptfkemyv:Uu7ANQ7FLFLXQwmpaaAZF5avBRgY1nLo@barnacle.rmq.cloudamqp.com/ptfkemyv', opts));
// io.origins(['https://flujo.flujo.in']); /// THIS HEADER IS REQUIRED TO ALLOW ONLY OUR CLIENT

let clients = {};
let users = {};

connectMongoSocket();

// messageHandler(io);

/**
 * @param privatechat is the namespace for single user chat.
 * @param client_id takes client id from the query string.
 */
const privatechat = io.of('privatechat').on('connection', socketConnection => {
    /** THIS A MIDDLE WHICH EXECUTES ON BEHALF OF EVERY SOCKET EVENT EXECUTION */
    // socketConnection.use((UCObj, next) => {
    //     if (UCObj[0] === 'user_login' && UCObj[1].user_id) { 
    //         console.log('inside if' ,  UCObj[1].user_id);
    //         return next(); 
    //     }
    //     console.log(UCObj);
    //     next(new Error('Not a doge error'));
    //   });

    onSocketConnection(socketConnection);
});
sockets = [];
function onSocketConnection(socket) {
    let client_id = socket.handshake.query.client_id;
    const message = { status: true, data: 'socket connected successfully' };
    socket.emit('connection', message);

    socket.on('update_client_sockets', (userData) => { updateClinetSockets(socket, userData) });

    socket.on('user_login', (userData) => { afterUserLogin(socket, userData) });

    socket.on('emit_change_loggedin_user_status', (userStatus) => { changeLoginUserStatus(socket, userStatus) });

    socket.on('user_typing_emit', (userData) => {
        userTyping(socket, userData, client_id);
    });

    socket.on('update_sender_old_message_emit', (messageObject) => { updateSenderOldMsgEmit(socket, messageObject) });

    socket.on('send_new_message', (messageData) => { sendNewMessage(socket, messageData); });

    socket.on('message_read_confirm_from_receiver', (readmessageData) => { messageReadConfirm(socket, readmessageData); });

    socket.on('message_received_confirm_from_receiver', (messageData) => { messageReceivedConfirm(socket, messageData); });

    socket.on('disconnect_private_chat_socket', (socketData) => { disconnectPrivateChatSocket(socket, socketData); });

    socket.on('delete_old_message', (messageObject) => { deleteOldMessages(socket, messageObject); });

    socket.on('delete_received_message_from_receiver_end_on_delete_everyone', (messageObject) => { deleteReceivedMessageOnDeleteEveryOne(socket, messageObject); });

    socket.on('change_user_profile_pic_emit', (messageObject) => { changeUserProfilePic(socket, messageObject); });

}

userTyping = async (socket, userData, client_id) => {
    try {
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
}

const updateClientUsers = (client_id) => {
    let user_ids = [];
    Object.keys(clients[client_id]).map(user_socket => {
        let user_id = clients[client_id][user_socket].user_id;
        let socket_key = user_socket;
        let userStatus = clients[client_id][user_socket].user_status;
        user_ids = [...user_ids, { user_id, socket_key, userStatus }];
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
const afterUserLogin = (socket, userData) => {
    console.log(`private chat users/sockets connected : ${Object.keys(io.sockets.connected).length}`);
    let users = {};
    if (socket.handshake.query.client_id) {
        let client_id = socket.handshake.query.client_id;
        socket.client_id = socket.handshake.query.client_id;
        socket.user_name = userData.user_name;
        socket.user_id = userData.user_id;
        socket.user_status = userData.user_status;
        users[`${userData.user_id}_${client_id}`] = socket;
        updateClients(client_id, users);
        socket.join(client_id, () => {
            updateClientUsers(client_id);
        });
    }
}
// });

/**
 * @param user_status
 */
changeLoginUserStatus = (socket, userData) => {
    if (userData.user_id && socket.handshake.query.client_id) {
        const clientId = socket.handshake.query.client_id;
        clients[clientId][`${userData.user_id}_${clientId}`].user_status = userData.user_status;
        userData.receivers_socket_keys.forEach(keyItem => {
            clients[clientId][keyItem].emit('listener_change_loggedin_user_status',
                { user_id: userData.user_id, user_status: userData.user_status });
        });
    }
}

/**
* this listens on user typing
* @param user_typeing
*/

/**
 * this listens on new Message
 * @param send_new_message
 */
sendNewMessage = async (socket, messageData) => {
    try {
        if (socket && socket.handshake && socket.handshake.query && socket.handshake.query.client_id) {
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
    }
    catch (error) {
        console.log(error)
    }
}

/**
 * @param messageData takes the message id object details for receiver read confirmation
 */
messageReadConfirm = async (socket, messageData) => {
    try {
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
    }
    catch (error) {
        console.log(error)
    }
}
// messageReceivedConfirm = async (socket, messageData) => {
//     let client_id = socket.handshake.query.client_id;
//         if (client_id) {
//             if (clients[client_id] &&
//                 clients[client_id][messageData.socket_key]) {
//                 const updateResult = await conversationSocketController.updateMessageReceipt(messageData, client_id, 0);
//                 clients[client_id][messageData.socket_key].emit('message_received_confirm_to_sender',
//                     { _id: messageData._id, user_id: messageData.user_id });
//             } else {
//                 return;
//             }
//         } else {
//             return
//         }
// }

/**
 * @param messageData takes the message id object details for receiver confirmation
 */
messageReceivedConfirm = async (socket, messageData) => {
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
}

/**
 * @param disconnect_private_chat_socket triggs when user wants to disconnect the connection
 */
disconnectPrivateChatSocket = (socket, socketData) => {
    let client_id = socket.handshake.query.client_id;
    if (client_id && clients[client_id] && clients[client_id][socketData.socket_key]) {
        if (clients[client_id][socketData.socket_key]) {
            delete clients[client_id][socketData.socket_key];
            updateClientUsers(client_id, socket);
        } else {
            return;
        }
    } else {
        return;
    }
}

/**
 * this is to delete users old messages
 */
deleteOldMessages = async (socket, messageObject) => {
    let client_id = socket.handshake.query.client_id;
    if (messageObject.deleteForBoth) {
        console.log(messageObject, 289)
        try {
            messageObject['deleted_by'] = '0';
            const result = await conversationSocketController.delete_message_by_message_id(messageObject, client_id)
            clients[client_id][messageObject.sender_socket_key].emit('delete_old_message_succes_listener', messageObject);
            // clients[client_id][messageObject.receiver_socket_key].emit('delete_old_message_listener_for_receiver', messageObject);
        } catch (error) {
            console.log(error);
        }
    } else {
        console.log(messageObject, 299);
        // update query has to be here.
        messageObject['deleted_by'] = messageObject.deleted_from;
        const result = await conversationSocketController.delete_message_by_message_id(messageObject, client_id)
        clients[client_id][messageObject.sender_socket_key].emit('delete_old_message_succes_listener', messageObject);
    }
}

/**
 * DELETE MESSAGE CONFIRMATION TO RECEIVER ON DELETE MESSAGE FOR BOTH PARTIES
 */
deleteReceivedMessageOnDeleteEveryOne = (socket, messageObject) => {
    let client_id = socket.handshake.query.client_id;
    clients[client_id][messageObject.receiver_socket_key].emit('delete_received_message_from_receiver_end_on_delete_everyone_listener', messageObject)
}
/**
 * 
 */
updateSenderOldMsgEmit = async (socket, messageObject) => {
    let client_id = socket.handshake.query.client_id;
    if (client_id) {
        if (clients[client_id] &&
            clients[client_id][messageObject.receiver_socket_key]) {
            const result = await conversationSocketController.updateMessageById(messageObject, client_id);
            if (result.nModified === 1) {
                messageObject['updated'] = true;
            } else {
                messageObject['updated'] = false;
            }
            clients[client_id][messageObject.receiver_socket_key].emit('update_sender_old_message_listen', messageObject);
            clients[client_id][messageObject.sender_socket_key].emit('update_sender_old_message_listen', messageObject);
        } else {
            return;
        }
    } else {
        return;
    }
}

changeUserProfilePic = (socket, userObject) => {
    let client_id = socket.handshake.query.client_id;
    io.of('privatechat').to(client_id).emit('change_user_profile_pic_listener', userObject);
}

/********************************* SOCKET R&D ************************************/
newUser = (socket, data) => {
    console.log(data);
    if (data in users) {
        return;
    } else {
        socket.nickName = data;
        users[socket.nickName] = socket;
        updateNickNames();
    }
}
/**
 * this is to send a message to a socket if a user is listed in users 
 */
sendMessage = (socket, data) => {
    if (data.nickname in users) {
        // io.of('privatechat').emit('new message', { message: data, nickname: socket.nickname });
        users[data.nickname].emit('new message', { message: data, nickname: socket.nickname });
    }
}
/**
 * this to create chat room
 */
disConnect = (socket, data) => {
    if (!socket.nickname) return;
    delete users[socket.nickname];
    updateNickNames();
}
// });

// io.of('groupchat').on('connection', (socket) => {
//     socket.on('join', data => {
//         console.log(`join room invoked`);
//         socket.join(data.room);
//         socket.emit('rooms', `A new user has joined the room ${data.room}`);
//     });

// });

app.use(handleErrors.handle404Error);
app.use(handleErrors.handleError);
const port = process.env.PORT || 3040;
server.listen(port, () => {
    console.log(`Im listening on ${process.env.NODE_ENV} environment with port ${server.address().port}`);
});

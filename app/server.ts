import express, { urlencoded } from 'express';
import http, { Server } from 'http';
import { welcomeController } from './controllers';
import { handle404Errors } from './middlewares/handleErrors';
import bodyParser from 'body-parser';
import cors from 'cors';
import SocketIO from 'socket.io';
import { IMessage } from './models/IMessage';


export class ChatServer {
    private app: express.Application;
    public static PORT: number = 3101 || process.env.PORT;
    private io: SocketIO.Server | undefined;
    private server: Server = new Server;
    public users = {} as any;
    constructor() {
        this.app = express();
        this.initialezeMiddleWares();
        this.createServer();
        this.listenServer();
        this.Socket();
    }

    private initialezeMiddleWares(): void {
        this.app.use(cors());
        this.app.use(bodyParser.json());
        this.app.use(bodyParser.urlencoded({ extended: true }));
        this.app.use('/', welcomeController);
        this.app.use(handle404Errors);
    }

    private createServer(): void {
        this.server = http.createServer(this.app);
    }

    private listenServer(): void {
        this.server.listen(ChatServer.PORT, () => {
            console.log(`server started! Listening on ${ChatServer.PORT}`);
        });
    }

    public getApp(): express.Application {
        return this.app;
    }

    Socket = () => {
        this.io = SocketIO(this.server);
        this.io.on('connection', (socket: any) => {
            // console.log(socket);
        });

        this.io.of('privatechat').on('connection', (socket: any) => {
            console.log('private chat');
            const updateNickNames = (io: any) => {
                io.of('privatechat').emit('usernames', Object.keys(this.users));
            }
            socket.on('new user', (data: any) => {
                console.log(data);
                if (data in this.users) {
                    return;
                } else {
                    socket.nickName = data;
                    this.users[socket.nickName] = socket;
                    updateNickNames(this.io);
                }
            });

            socket.on('sendmessage', (data: IMessage) => {
                console.log(data, 86);
                if (data.nickname in this.users) {
                    // io.of('privatechat').emit('new message', { message: data, nickname: socket.nickname });
                    console.log('im emitted');
                    this.users[data.nickname].emit('new message', { message: data, nickname: socket.nickname });
                }
            });

            socket.on('disconnectsocket', (data: any) => {
                if (!socket.nickName) {
                    return
                };
                delete this.users[socket.nickName];
                updateNickNames(this.io);
            });
        })
    }

}

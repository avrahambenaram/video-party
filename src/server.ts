import express from 'express';
import { Server } from 'socket.io';
import { createServer } from 'http';
import { join } from 'path';

interface Users {
    [id: string]: {
        name: string
    }
}

const app = express();
const server = createServer(app);
const io = new Server(server);
const port = 3000;

const path = join(__dirname, 'public');

app.get('/', (req, res, next) => {
    console.log(req.connection.remoteAddress);
    next();
})
app.use(express.static(path));

const video: any = {
    currentTime: 0,
    paused: false,
	interval: 0
}

const users: Users = {};
const names: Array<string> = [];

io.use((socket, next) => {
    if (!socket.handshake.headers.name) {
        return;
    }
    if (typeof(socket.handshake.headers.name) !== 'string') {
        return;
    }
    users[socket.id] = {
        name: socket.handshake.headers.name
    }
    names.push(socket.handshake.headers.name);
    next();
})
io.on('connection', socket => {
    console.log(`Conectado: ${socket.id}`);
    const name = users[socket.id].name;

    io.emit('user-connected', name);

    socket.emit('status', {
        currentTime: video.currentTime,
        paused: video.paused
    });
    
    socket.on('pause', () => {
        console.log('pause')
        if (!video.paused) {
            video.paused = true;
            io.emit('pause');
        }

		clearInterval(video.interval);
        video.interval = 0;
    })
    socket.on('play', () => {
        console.log('play')
        if (video.paused) {
            video.paused = false;
            io.emit('play');
        }

		if (!video.interval) {
            video.interval = setInterval(() => {
                video.currentTime += 100;
            }, 100)
        }
    })
    socket.on('timeupdate', currentTime => {
        console.log('timeupdate')
        socket.broadcast.emit('timeupdate', currentTime);
        video.currentTime = currentTime;
    })
    socket.on('message', txt => {
        if (txt) {
            io.emit('message', {
                user: name,
                content: txt
            })
        }
    })
    socket.on('disconnect', () => {
        console.log('disconnect')
        const index = names.indexOf(name);
        names.splice(index, 1);
        delete users[socket.id];

        console.log(`Desconectado: ${socket.id}`);
        io.emit('user-disconnected', name);
    })
})

server.listen(port, () => {
    console.log(`Server running on port ${port}`);
})
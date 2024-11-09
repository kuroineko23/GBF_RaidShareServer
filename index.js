const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server, {
    serveClient: false,
    path: '/socket'
  });
const cors = require('cors');
const { authMiddleware } = require('./auth');

var corsOptions = {
    origin: '*',
    optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
    methods: ['GET', 'POST']
}

app.use(express.json());
app.use(cors(corsOptions));
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});
app.post('/sendcode', authMiddleware, (req, res) => {
    io.to(req.body.room_id).emit("message", req.body)
    res.sendStatus(200)
})

io.on("connection", async (socket) => {
    socket.on('join', (arg) => {
        if (socket.rooms.size > 1) {
            var it = socket.rooms.keys()
            it.next()
            var room = it.next()
            console.log(socket.id + ' leaving room ' + room.value)
            socket.leave(room.value)
        }
        socket.join(arg)
        console.log(socket.id + ' joined room ' + arg);
    })
});

server.listen(3000, () => {
    console.log(`listening on :3000`)
})
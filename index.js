const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const redis = require("redis");
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
app.use(function (err, req, res, next) {
    console.log(err)
    res.status(err.status || 500);
    res.send({
        'message': err.message
    });
});
let redisClient;
(async () => {
    redisClient = redis.createClient();

    redisClient.on("error", (error) => console.error(`Error : ${error}`));

    await redisClient.connect();
})();

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});
app.use(express.static(__dirname + '/css/'));
app.post('/sendcode', authMiddleware, async (req, res) => {
    var code = req.body.code;
    var regex = new RegExp("[A-F0-9]+");
    if (typeof code === "string" || code instanceof String) {
        if (code.match(regex) && code.length == 8) {
            const cacheResult = await redisClient.get(code)
            console.log("cacheResult " + cacheResult)
            if (cacheResult) {
            } else {
                await redisClient.set(code, "exist", { EX: 60 })
                io.to(req.body.roomId).emit("message", req.body)
            }
            res.sendStatus(200);
        }
        else {
            res.send("not a raid code");
        }
    }
})

io.on("connection", async (socket) => {
    socket.on('join', (arg) => {
        if (socket.rooms.size > 1) {
            var it = socket.rooms.keys()
            it.next()
            var room = it.next()
            socket.leave(room.value)
        }
        socket.join(arg)
    })
});

server.listen(3000, () => {
    console.log(`listening on :3000`)
})

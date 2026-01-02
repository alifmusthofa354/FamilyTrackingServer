const { Server } = require("socket.io");
const socketService = require('../services/socketService');

module.exports = (server) => {
    const io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        }
    });

    socketService.init(io);

    io.on('connection', (socket) => {
        socketService.handleConnection(socket);
    });

    return io;
};

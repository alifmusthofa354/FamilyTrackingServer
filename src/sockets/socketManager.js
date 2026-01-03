const { Server } = require("socket.io");
const socketService = require('../services/socketService');

module.exports = (server) => {
    const io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"],
            allowedHeaders: ["my-custom-header", "ngrok-skip-browser-warning"],
            credentials: true
        }
    });

    socketService.init(io);

    io.on('connection', (socket) => {
        socketService.handleConnection(socket);
    });

    return io;
};

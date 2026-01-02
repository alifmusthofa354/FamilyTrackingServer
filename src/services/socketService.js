// In-memory storage for connected users
// Structure: { userId: { id, name, lat, lng, timestamp, socketId } }
let users = {};

class SocketService {
    constructor() {
        this.io = null;
    }

    init(io) {
        this.io = io;
    }

    handleConnection(socket) {
        console.log('A user connected:', socket.id);

        // 1. Send current users to the newly connected client
        socket.emit('current-users', users);

        // 2. Handle location updates
        socket.on('send-location', (data) => this.handleLocationUpdate(socket, data));

        // 3. Handle disconnect
        socket.on('disconnect', () => this.handleDisconnect(socket));
    }

    handleLocationUpdate(socket, data) {
        const { id, name, lat, lng } = data;

        // Update or add user data
        users[id] = {
            id,
            name,
            lat,
            lng,
            timestamp: Date.now(),
            socketId: socket.id
        };

        console.log(`Location update from ${name} (${id}): [${lat}, ${lng}]`);

        // Broadcast to all clients
        if (this.io) {
            this.io.emit('receive-location', users[id]);
        }
    }

    handleDisconnect(socket) {
        console.log('User disconnected:', socket.id);

        // Find user by socketId
        const userId = Object.keys(users).find(key => users[key].socketId === socket.id);

        if (userId) {
            console.log(`User ${users[userId].name} (${userId}) went offline.`);
            delete users[userId];

            // Notify clients
            if (this.io) {
                this.io.emit('user-disconnected', userId);
            }
        }
    }
}

module.exports = new SocketService();

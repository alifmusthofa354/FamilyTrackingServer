const userService = require('./userService');

// In-memory storage for connected users
// Structure: { userId: { id, name, lat, lng, timestamp, socketId, profilePicturePath } }
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

    async handleLocationUpdate(socket, data) {
        const { id, name, lat, lng, profilePicturePath } = data; // Accept path from client if available

        // Initialize user object if not exists
        if (!users[id]) {
            users[id] = { id, name, lat, lng, timestamp: Date.now(), socketId: socket.id };

            // Fetch profile picture from DB if not provided by client
            if (!profilePicturePath) {
                try {
                    // We assume 'id' matches the DB UUID. 
                    // Note: If 'id' from android is just a random string and not the UUID, this will fail.
                    // But if it is the UUID, this works.
                    // We need a way to get the user based on 'id' if 'id' is the uuid.
                    const user = await userService.getUserById(id);
                    if (user && user.profilePicturePath) {
                        users[id].profilePicturePath = user.profilePicturePath;
                    }
                } catch (err) {
                    // User not found in DB or ID mismatch, ignore
                }
            } else {
                users[id].profilePicturePath = profilePicturePath;
            }
        } else {
            // Update existing
            users[id].lat = lat;
            users[id].lng = lng;
            users[id].timestamp = Date.now();
            users[id].socketId = socket.id;
            if (profilePicturePath) users[id].profilePicturePath = profilePicturePath;
            // If already cached from DB, it persists
        }

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

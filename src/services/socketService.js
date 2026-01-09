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
        const { id, name, lat, lng, profilePicturePath } = data;

        if (!id || !name) return;

        // Check if user exists in memory
        if (!users[id]) {
            // NEW USER: Create initial record
            users[id] = {
                id,
                name,
                lat,
                lng,
                socketId: socket.id,
                timestamp: Date.now(),
                profilePicturePath: profilePicturePath || null
            };

            // SELF-CORRECTION: If no photo provided by client, try fetching from Database
            if (!profilePicturePath) {
                try {
                    const user = await userService.getUserById(id);
                    if (user && user.profilePicturePath) {
                        users[id].profilePicturePath = user.profilePicturePath;
                        // Broadcast once more after DB fetch succeeds
                        if (this.io) this.io.emit('receive-location', users[id]);
                    }
                } catch (err) {
                    console.error(`DB fetch failed for ${id}:`, err.message);
                }
            }
        } else {
            // EXISTING USER: Update essential location data
            users[id].lat = lat;
            users[id].lng = lng;
            users[id].timestamp = Date.now();
            users[id].socketId = socket.id;
            
            // SMART SYNC: Only update photo if client sends a new value (non-empty)
            // If client sends null/undefined, we keep the previous photo in memory
            if (profilePicturePath) {
                users[id].profilePicturePath = profilePicturePath;
            }
        }

        console.log(`Loc from ${name}: [${lat}, ${lng}]`);

        // Broadcast the full user object (with photo) to all clients
        if (this.io) {
            this.io.emit('receive-location', users[id]);
        }
    }

    handleDisconnect(socket) {
        console.log('User disconnected:', socket.id);

        // Find user by socketId
        const userId = Object.keys(users).find(key => users[key].socketId === socket.id);

        if (userId) {
            console.log(`User ${users[userId].name} offline.`);
            delete users[userId];

            // Notify clients
            if (this.io) {
                this.io.emit('user-disconnected', userId);
            }
        }
    }
}

module.exports = new SocketService();
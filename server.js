const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');
const path = require('path');

const app = express();
const server = http.createServer(app);

// Use CORS to allow connections from different origins (like the mobile app or separate frontend dev server)
app.use(cors());

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

const io = new Server(server, {
    cors: {
        origin: "*", // Allow all origins for now to simplify mobile connection
        methods: ["GET", "POST"]
    }
});

// Store connected users and their latest locations
// Structure: { socketId: { id, name, lat, lng, timestamp } }
let users = {};

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Send current users to the newly connected client
    socket.emit('current-users', users);

    // Handle location updates from clients (Mobile App or Web Simulator)
    socket.on('send-location', (data) => {
        // data should look like: { id: "user123", name: "Dad", lat: -6.2088, lng: 106.8456 }
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

        // Broadcast the update to all other connected clients (Web App)
        io.emit('receive-location', users[id]);
    });

    // Handle disconnect
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        // Optional: Remove user from list or mark as offline
        // For now, we keep the last known location but we could remove it locally if needed
        // const userId = Object.keys(users).find(key => users[key].socketId === socket.id);
        // if (userId) delete users[userId];
        // io.emit('user-disconnected', userId);
    });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

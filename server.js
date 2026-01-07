const express = require('express');
const http = require('http');
const expressConfig = require('./src/config/express');
const socketManager = require('./src/sockets/socketManager');

const app = express();
const server = http.createServer(app);

// 1. Setup Express
expressConfig(app);

// Routes
app.use('/api/auth', require('./src/routes/authRoutes'));
app.use('/api/users', require('./src/routes/userRoutes'));

// 2. Setup Socket.io
socketManager(server);

// 3. Start Server
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

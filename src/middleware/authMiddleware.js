const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
    // 1. Get token from header
    const token = req.header('Authorization');

    // Check if no token
    if (!token) {
        return res.status(401).json({ message: 'No token, authorization denied' });
    }

    // Format usually: "Bearer <token>"
    // So we split and take the second part
    const tokenString = token.startsWith('Bearer ') ? token.slice(7, token.length) : token;

    try {
        // 2. Verify token
        const jwtSecret = process.env.JWT_SECRET || 'secret_dev_key';
        const decoded = jwt.verify(tokenString, jwtSecret);

        // 3. Attach user to request object
        // Payload authService: { user: { id, name, email } }
        req.user = decoded.user;

        next();
    } catch (err) {
        res.status(401).json({ message: 'Token is not valid' });
    }
};

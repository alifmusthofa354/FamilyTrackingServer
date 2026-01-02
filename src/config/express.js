const express = require('express');
const cors = require('cors');
const path = require('path');

module.exports = (app) => {
    // Middleware
    app.use(cors());
    app.use(express.json());

    // Static Files
    // Note: Assuming 'public' is in the root project folder
    app.use(express.static(path.join(__dirname, '../../public')));
};

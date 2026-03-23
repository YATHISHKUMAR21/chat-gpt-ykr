const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');

// routes
const authRoutes = require('./routes/auth.routes');
const chatRoutes = require('./routes/chat.routes.js');

const app = express();

// middleware
app.use(cookieParser());
app.use(express.json());

// ✅ Serve frontend (VERY IMPORTANT)
app.use(express.static(path.join(__dirname, '../public')));

// ✅ API routes
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);

// ✅ React fallback (VERY IMPORTANT)
app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

module.exports = app;
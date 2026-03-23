const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');

// routes
const authRoutes = require('./routes/auth.routes');
const chatRoutes = require('./routes/chat.routes.js');

const app = express();

app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true,
}));

app.use(cookieParser());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);

// root route
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

module.exports = app;
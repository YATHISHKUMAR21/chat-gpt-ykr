const express = require('express');
const cookieParser = require('cookie-parser');

//auth routes
const authRoutes = require('./routes/auth.routes');

//chat routes
const chatRoutes = require('./routes/chat.routes');


const app = express();
app.use(cookieParser());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);




module.exports = app;
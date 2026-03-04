const { Server } = require("socket.io");
const cookie = require('cookie');
const jwt = require('jsonwebtoken');
const UserModel = require('../models/user.model');


function initSocketServer(httpServer){
    const io = new Server(httpServer, {});

    io.use(async(socket, next)=>{
        const cookies = socket.handshake.headers.cookie ? cookie.parse(socket.handshake.headers.cookie) : {};
        // console.log("socket cookies: ", cookies)
        if(!cookies.token){
            return next(new Error("authentication failed: no token inside cookies"));
        }
        try{
            const decoded = jwt.verify(cookies.token, process.env.JWT_SECRET);

            const user = await UserModel.findById(decoded.id);
            if(!user){
                next(new Error("authentication failed: user not found"));
            }
            socket.user = user;
            next();
            
        }
        catch(err){
            next(new Error("authentication failed: invalid token"));
        }
    });

    io.on("connection", (socket) => {
        console.log("socket user: ", socket.user)
        console.log("new socket connection: ", socket.id);
    });


}


module.exports = initSocketServer;


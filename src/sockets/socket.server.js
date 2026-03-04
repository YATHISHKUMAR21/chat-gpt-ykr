const { Server } = require("socket.io");
const cookie = require('cookie');
const jwt = require('jsonwebtoken');
const UserModel = require('../models/user.model');
const aiService = require('../services/ai.service');
const messageModel = require('../models/message.model');


console.log("today")
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
        // console.log("socket user: ", socket.user)
        // console.log("new socket connection: ", socket.id);

        socket.on("ai-message", async(messagePayload)=>{

            console.log("received ai-message: ", messagePayload);  //chatid and content

            await messageModel.create({
                chat : messagePayload.chat,
                user : socket.user._id,
                content : messagePayload.content,
                role : "user"

            })

            const aiResponse = await aiService.generateResponse(messagePayload.content);
            console.log("ai response: ", aiResponse);

            await messageModel.create({
                chat : messagePayload.chat,
                user : socket.user._id,
                content : aiResponse,
                role : "model"

            });
            
            socket.emit("ai-response", {
                content : aiResponse,
                chat : messagePayload.chat

            })
        })

    });


}


module.exports = initSocketServer;


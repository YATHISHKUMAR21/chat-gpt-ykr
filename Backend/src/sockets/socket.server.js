const { Server } = require("socket.io");
const cookie = require('cookie');
const jwt = require('jsonwebtoken');
const UserModel = require('../models/user.model');
const aiService = require('../services/ai.service');
const messageModel = require('../models/message.model');
const { createMemory, queryMemory } = require('../services/vector.service');
const { text } = require("express");


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

            // console.log("received ai-message: ", messagePayload);  //chatid and content

            // const message =  await messageModel.create({
            //     chat : messagePayload.chat,
            //     user : socket.user._id,
            //     content : messagePayload.content,
            //     role : "user"

            // });

            // console.log("Message created with ID:", message._id);

            // const vectors = await aiService.generateVector(messagePayload.content);

            // Parallelize message creation and vector generation
            const [message , vectors] = await Promise.all([
                messageModel.create({
                    chat : messagePayload.chat,
                    user : socket.user._id,
                    content : messagePayload.content,
                    role : "user"
                }),
                aiService.generateVector(messagePayload.content)
            ]);

            // Store in vector memory after getting both message and vectors
            if(message._id) {
                await createMemory({
                    vectors,
                    messageId : message._id,
                    metadata : {
                        id: String(message._id),
                        chat : messagePayload.chat,
                        user : socket.user._id,
                        text : messagePayload.content
                    }
                })
            }


        //    const memory = await queryMemory({
        //         queryVector: vectors,
        //         limit: 3,
        //         metadata : {
        //            user : socket.user._id
        //         }
        //     });

            // console.log("memory query results: ", memory);

            // if(message._id) {
            //     await createMemory({
            //         vectors,
            //         messageId : message._id,
            //         metadata : {
            //             id: String(message._id),
            //             chat : messagePayload.chat,
            //             user : socket.user._id,
            //             text : messagePayload.content
            //         }
            //     })
            // } else {
            //     console.error("Message ID is undefined, skipping vector storage");
            // }



            // console.log("retrieved memory: ", memory);

            
            //this is the short term memory for ai to generate response, we fetch last 20 messages from the database for the current chat,
            //  sorted by creation time in descending order, 
            // then reverse it to get the correct sequence for ai context

            // const chatHistory = (await messageModel.find({chat: messagePayload.chat}).sort({createdAt: -1})
            // .limit(20).lean()).reverse();  

            // Parallelize memory query and chat history fetch
            const [memory, chatHistoryUnsorted] = await Promise.all([
                queryMemory({
                    queryVector: vectors,
                    limit: 3,
                    metadata : {
                       user : socket.user._id
                    }
                }),
                messageModel.find({chat: messagePayload.chat}).sort({createdAt: -1})
                .limit(20).lean()
            ]);

            // Reverse to get correct sequence for AI context
            const chatHistory = chatHistoryUnsorted.reverse();


            //fetch last 20 messages for context, sorted by creation time in descending order,
            //  then reversed to get the correct sequence

            // console.log("chat history: ", chatHistory.map(item=>{
            //     return {  
            //           role: item.role,
            //           parts : [{ text: item.content }]
            //     };
            // }));

            const stm = chatHistory.map(item=>{
                return {  
                      role: item.role,
                      parts : [{ text: item.content }]
                };
            });

            const ltm = [
                {
                    role : "user",
                    parts : [
                        {
                            text : `
                            
                            these are some previous messages from
                            the chats , use them to generate response
                            ${memory.map(item=> item.metadata.text).join("\n")}
                              
                            
                            `
                        }
                    ]
                }
            ];

            // Log the combined context
            ([...stm, ...ltm]).map(item=>{
                console.log("item: ", item);
            });
      
            const aiResponse = await aiService.generateResponse([...stm, ...ltm]);

             
            // console.log("ai response: ", aiResponse);

        //    const responseMessage =  await messageModel.create({
        //         chat : messagePayload.chat,
        //         user : socket.user._id,
        //         content : aiResponse,
        //         role : "model"

        //     });
            
        //     console.log("Response message created with ID:", responseMessage._id);
            
        //     const responseVectors = await aiService.generateVector(aiResponse);


        
            socket.emit("ai-response", {
                content : aiResponse,
                chat : messagePayload.chat

            });

        const [responseMessage, responseVectors] = await Promise.all([
            messageModel.create({
                chat : messagePayload.chat,
                user : socket.user._id,
                content : aiResponse,
                role : "model"

            }),
            aiService.generateVector(aiResponse)
        ]);
            
            if(responseMessage._id) {
                await createMemory({  
                    vectors : responseVectors,
                    messageId : responseMessage._id,
                    metadata : {
                        id: String(responseMessage._id),
                        chat : messagePayload.chat,
                        user : socket.user._id,
                        text : aiResponse
                    }
                })
            } else {
                console.error("Response message ID is undefined, skipping vector storage");
            }

            
        })

    });


}


module.exports = initSocketServer;


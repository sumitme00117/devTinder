const socket = require("socket.io");
const crypto = require("crypto");
const Chat = require("../models/chat");

const getSecretRoomId = (userId, targetUserId) => {
  return crypto.createHash("sha256").update([userId, targetUserId].sort().join("_")).digest("hex")
}

const initializeSocket = (server) => {
  const io = socket(server, {
    cors: {
      origin: "http://localhost:5173",
    },
  });

  io.on("connection", (socket) => {

    socket.on("joinChat", ({userId, targetUserId}) => {
      const roomId = getSecretRoomId(userId, targetUserId)

      socket.join(roomId)
    })

    socket.on("sendMessage", async ({firstName, lastName, userId, targetUserId, text}) => {

      // Save messages to the database

      try{
         const roomId = getSecretRoomId(userId, targetUserId)

         let chat = await Chat.findOne({
          participants: {$all: [userId, targetUserId]}
         })

         // If chat not found, it means the user is interacting for first time with this user

         if(!chat){
          chat = new Chat({
            participants: [userId, targetUserId],
            messages: []
          })
         }

         chat.messages.push({
          senderId: userId,
          text
         })

         await chat.save()

         io.to(roomId).emit("messageReceived", {firstName, lastName, text})

      }
      catch (err){
        console.log(err)
      }

    })

    socket.on("disconnect", () => {})

  });

  
};

module.exports = initializeSocket;

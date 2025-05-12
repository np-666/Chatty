import { Server } from "socket.io";
import http from "http";
import express from "express";

// Create a new app server for socket
const app = express();
const server = http.createServer(app);

// Allow the server to accept from the frontend
const io = new Server(server, {
    cors: {
        origin: ["http://localhost:5173"]
    }
});

export function getReceiverSocketId(userId) {
    return userSocketMap[userId];
}

// Used to store online users
const userSocketMap = {};

// Socket connections and functions
io.on("connection", (socket) => {
    console.log("A user connected: ", socket.id);

    // Update online users
    const userId = socket.handshake.query.userId;
    if(userId) userSocketMap[userId] = socket.id;
    io.emit("GetOnlineUsers", Object.keys(userSocketMap)); // Send events to all clients

    socket.on("disconnect", () => {
        console.log("A user disconnected: ", socket.id);
        delete userSocketMap[userId];
        io.emit("GetOnlineUsers", Object.keys(userSocketMap)); // Send events to all clients
        
    });
});

export { io, app, server };
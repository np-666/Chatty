import User from "../models/user.model.js";
import Message from "../models/message.model.js"
import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

export const getUsersForSidebar = async (req, res) => {
    try {
        // Get the users who are in contact
        const loggedInUserId = req.user._id;
        const filteredUsers = await User.find({_id: {$ne:loggedInUserId}}).select("-password");
        res.status(200).json(filteredUsers);

    } catch(error) {
        console.log("Error in getUsersForSidebar: ", error.message);
        res.status(500).json({ error: "Internal server error"});
    }
};

export const getMessages = async (req, res) => {
    try {
        // Get the recipitent of chat and their chat history 
        const { id:userToChatId } = req.params;
        const myId = req.user._id;

        const messages = await Message.find({
            $or: [
                {senderId: myId, recieverId: userToChatId},
                {senderId: userToChatId, recieverId: myId}
            ]
        })
        res.status(200).json(messages);

    } catch(error){
        console.log("Error in getMessages controller: ", error.message);
        res.status(500).json({ error: "Internal server error"});
    }
};

export const sendMessage = async (req, res) => {
    try {
        // Get the text or image that is being sent
        const { text, image } = req.body;
        const { id: recieverId } = req.params;
        const senderId = req.user._id;

        let imageUrl;
        if(image){
            // Upload base 64 image to cloudinary
            const uploadResponse = await cloudinary.uploader.upload(image);
            imageUrl = uploadResponse.secure_url;
        }

        // New message being created
        const newMessage = new Message({
            senderId,
            recieverId,
            text,
            image:imageUrl,
        });

        await newMessage.save();

        const receiverSocketId = getReceiverSocketId(recieverId);
        if(receiverSocketId) {
            io.to(receiverSocketId).emit("newMessage", newMessage);
        }

        res.status(201).json(newMessage);

    } catch(error) {
        console.log("Error in sendMessage controller: ", error.message);
        res.status(500).json({ error: "Internal server error"});
    }
};
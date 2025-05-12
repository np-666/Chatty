import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

export const protectRoute = async (req, res, next) => {
    try {
        // Check if the user is authenticated 
        const token = req.cookies.jwt;
        if(!token){
            return res.status(401).json({ message: "Unauthorized - No token provided"});
        }

        // Check if the token is valid
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if(!decoded){
            return res.status(401).json({ message: "Unauthorized - No token provided"});
        }

        // Check for the user
        const user = await User.findById(decoded.userId).select("-password");
        if(!user){
            return res.status(404).json({ message: "User not found"});
        }

        // Allow the next function to be executed
        req.user = user;
        next();

    } catch(error) {
        console.log("Error in protectRoute middleware: ", error.message);
        res.status(500).json({ message: "Internal server error"});        
    }
}
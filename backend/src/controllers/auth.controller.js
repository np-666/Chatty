import bcrypt from "bcryptjs";
import { generateToken } from "../lib/utils.js";
import User from "../models/user.model.js";
import cloudinary from "../lib/cloudinary.js";

export const signup = async (req, res) => {
    const { email, fullName, password } = req.body;
    try {
        // Ensure all fields are filled before proceeding
        if(!fullName || !email || !password){
            res.status(400).json({ message: "All fields are required"});
        }

        // Password Length Checker
        if(password.length < 6){
            return res.status(400).json({ message: "Password must be atleast 6 characters long"});
        }

        // Checking if the email already exists
        const user = await User.findOne({email});
        if(user) return res.status(400).json({ message: "Email already exists"});

        // Hashing Password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Creating new user with the given credentials
        const newUser = new User({
            fullName,
            email,
            password:hashedPassword
        });

        // If user created, save it in database and output the contents of newUser
        if(newUser){
            generateToken(newUser._id, res);
            await newUser.save();
            res.status(201).json({
                _id: newUser._id,
                fullName: newUser.fullName,
                email: newUser.email,
                profilePic: newUser.profilePic
            })
        } else {
            res.status(400).json({ message: "Invalid user data"});
        }
    } catch (error) {   
        console.log("Error in signup controller", error.message);
        res.status(500).json({ message: "Internal server error"});
    }
};

export const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        // Check for user in database
        const user = await User.findOne({email});

        if(!user){
            return res.status(400).json({ message: "Invalid credentials"});
        }

        // Check for correctness of password
        const isPasswordCorrect = await bcrypt.compare(password, user.password);

        if(!isPasswordCorrect){
            res.status(400).json({ message: "Invalid credentials"});
        }

        // Generate JWT token
        generateToken(user._id, res);
        res.status(200).json({
            _id: user._id,
            fullName: user.fullName,
            email: user.email,
            profilePic: user.profilePic

        });
    } catch(error) {
        console.log("Error in login controller ", error.message);
        res.status(500).json({ message: "Internal server error"});
    }
};

export const logout = (req, res) => {
    try {
        // Destroy the JWT token 
        res.cookie("jwt", "", {maxAge:0});
        res.status(200).json({ message: "Logged out successfully"});
    } catch(error) {
        console.log("Error in logging out ", error.message);
        res.status(500).json({ message: "Internal server error"});
    }
};

export const updateProfile = async (req, res) => {
    try {
        // Get image and profile information 
        const { profilePic } = req.body;
        const userId = req.user._id;

        // If no profile picture
        if(!profilePic){
            return res.status(400).json({ message: "Profile pic required"});
        }

        // Update profile picture
        const uploadResponse = await cloudinary.uploader.upload(profilePic);
        const updateUser = await User.findByIdAndUpdate(userId, {profilePic:uploadResponse.secure_url}, {new:true});
        res.status(200).json(updateUser);

    } catch(error) {
        console.log("Error in update profile: ", error);
        res.status(500).json({ message: "Internal server error"});        
    }
};

export const checkAuth = async (req, res) => {
    try {
        res.status(200).json(req.user);
    } catch(error) {
        console.log("Error in checkAuth controller: ", error.mesage);
        res.status(500).json({ message: "Internal server error"});
    }
};
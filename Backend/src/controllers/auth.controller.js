const userModel = require("../models/user.model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

async function registerUser(req, res){

    const { fullName : {firstName, lastName}, email, password } = req.body;
    
    try {
        const isUserAlreadyExist = await userModel.findOne({ email });

        if(isUserAlreadyExist){
            return res.status(400).json({
                message: "User already exists"
            });
        }

        const hashPassword = await bcrypt.hash(password, 10);

        const user = await userModel.create({
            fullName: {
                firstName,
                lastName
            },
            email,
            password: hashPassword
        }); 

        const token = jwt.sign({id: user._id}, process.env.JWT_SECRET);

        res.cookie("token", token);

        res.status(201).json({
            message: "User registered successfully",  
            user : {
                email : user.email,
                fullName : user.fullName,
                id : user._id

            }
        });


    } catch (error) {
        res.status(500).json({
            message: "Internal server error"
        });
    }
}

async function loginUser(req, res){
    const { email , password } = req.body;

    const user = await userModel.findOne({
        email
    })

    if(!user){
        return res.status(400).json({
            message: "Invalid credentials"
        });
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if(!isPasswordValid){
        return res.status(400).json({
            message: "Invalid credentials"
        });
    }

    const token = jwt.sign({id: user._id}, process.env.JWT_SECRET);

    res.cookie("token", token);
    
    res.status(200).json({
        message: "Login successful",
        user : {
            email : user.email,
            fullName : user.fullName,
            id : user._id
        }
    });


}


module.exports = {
    registerUser,
    loginUser
}
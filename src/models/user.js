const mongoose = require('mongoose');
const validator = require('validator');
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
        minlength: 4,
        maxlength: 20,
    },
    lastName: {
        type: String,
    },
    emailId: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        validate(value){
            if(!validator.isEmail(value)){
                throw new Error("Invalid email address")
            }
        }
    },
    password: {
        type: String,
        required: true,
        validate(value){
            if(!validator.isStrongPassword(value)){
                throw new Error("Please enter strong password")
            }
        }
    },
    age: {
        type: Number,
        min: 18,
    },
    gender: {
        type: String,
        validate(value){
            if(!['male', 'female', 'other'].includes(value)){
                throw new Error("Gender must be male, female or other")
            }
        }
    },
    photoUrl: {
        type: String,
        default: "https://www.vecteezy.com/png/24983914-simple-user-default-icon",
        validate(value){
            if(!validator.isURL(value)){
                throw new Error("Invalid photo URL")
            }
        }
    },
    about: {
        type: String,
        default: "I am new to DevTinder, nice to meet you all!"
    },
    skills: {
        type: [String],
    }
}, {timestamps: true})


userSchema.index({firstName: 1, lastName: 1})

userSchema.methods.getJWT = async function(){
    const user = this

    const token = await jwt.sign({ _id: user._id }, "DEV@Tinder$790", {expiresIn: "1d"});

    return token
}

userSchema.methods.validatePassword = async function(passwordInputByUser){
    const user = this

    const isPasswordValid = await bcrypt.compare(passwordInputByUser, this.password);

    return isPasswordValid
}

const User = mongoose.model('User', userSchema);

module.exports = User;
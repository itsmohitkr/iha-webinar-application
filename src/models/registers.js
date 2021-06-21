const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// create schema 
const ihaSchema = new mongoose.Schema({
    firstname: {
        type: String,
        required:true
    },
    lastname: {
        type: String,
        required:true
    },
    email: {
        type: String,
        required: true,
        unique:true
    },
    phone: {
        type: Number,
        required: true,
        unique:true
    },
    password: {
        type: String,
        required:true
    },
    confirmpassword: {
        type: String,
        required:true
    },
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }]
})



// middleware for generating tokens 

ihaSchema.methods.generateAuthToken=async function () {
    try {
        const token = jwt.sign({ _id: this._id.toString()}, process.env.SECRET_KEY);
        this.tokens = this.tokens.concat({ token: token });
        await this.save();
        // console.log(token); 
        return token;
    } catch (error) {
        res.send("error");
        console.log(error);
    }
}


// middleware for hashing passwords

ihaSchema.pre("save",async function (next) {
    
    if (this.isModified("password")) {
        console.log(`current password is ${this.password}`);
        this.password = await bcrypt.hash(this.password,10);
        console.log(`current password is ${this.password}`);
        this.confirmpassword = await bcrypt.hash(this.password, 10);
    }
    next();
})
// create collections

const Register = new mongoose.model("Register", ihaSchema);

module.exports = Register;
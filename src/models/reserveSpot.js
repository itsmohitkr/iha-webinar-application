const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const validator = require('validator');

// create schema 
const registration_for_webinar = new mongoose.Schema({
    fullname: { 
        type: String,
        touppercase:true,
        required: true
    },

    email: {
        type: String,
        required: true,
        tolowercase:true,
        unique: true
    },

    organisation: {
        type: String,
        touppercase: true,
        required: true
    }

})


const Register_Webinar = new mongoose.model("Register_Webinar", registration_for_webinar);

module.exports = Register_Webinar;
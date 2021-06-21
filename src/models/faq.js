const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// create schema 
const faq_schema = new mongoose.Schema({
    fullname: {
        type: String,
        touppercase: true,
        required: true
    },

    email: {
        type: String,
        required: true,
        unique: true
    },

    questions: {
        type: String,
        touppercase: true,
        required: true
    },
    feedback: {
        type: String,
        max:150
    }

})



const Drop_query = new mongoose.model("Drop_query", faq_schema);

module.exports = Drop_query;
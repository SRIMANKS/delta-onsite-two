const mongoose = require("mongoose");

const websiteschema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
    },
    mailid: {
        type: String,
        required: true,
    },
    instagramid: String,
    facebookid: String,
    twitterid: String,
    linkedinid: String,
    creatorid:{
        type: String,
        required: true,
    }
});

module.exports = mongoose.model("Website", websiteschema);
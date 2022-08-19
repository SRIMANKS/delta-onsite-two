const mongoose  = require("mongoose");

const linkschema = new mongoose.Schema({
    name: String,
    link: String,
    websiteId: String,
});
module.exports = mongoose.model("Link", linkschema);
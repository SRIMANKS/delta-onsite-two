const mongoose  = require("mongoose");

const linkschema = new mongoose.Schema({
    name: String,
    link: String,
    websiteId: String,
    bgcolor: String,
    fontcolor: String,
});
module.exports = mongoose.model("Link", linkschema);
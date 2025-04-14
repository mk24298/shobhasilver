const mongoose = require("mongoose");
const mongodb=async ()=>{
    await mongoose.connect("mongodb+srv://shobhasilversnwb:2wsQGIb4uP2jQRGE@cluster0.r4hw8rl.mongodb.net/Silvers")
    console.log("db Connected")
}
module.exports = mongodb;

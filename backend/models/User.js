const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String },
    address: { type: String },
    password: { type: String, required: true },
    role: { 
        type: String, 
        enum: ["admin", "customer", "delivery"], 
        default: "customer" 
    }
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);

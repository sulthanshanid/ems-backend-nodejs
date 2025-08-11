const mongoose = require("mongoose");
const workplaceSchema = new mongoose.Schema({
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  name: { type: String, required: true, trim: true },
}, { timestamps: true });
module.exports = mongoose.model("Workplace", workplaceSchema);

const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
  text: String,
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  answered: { type: Boolean, default: false },
  answer: { type: String, default: "" }
});

const amaSessionSchema = new mongoose.Schema(
  {
    host: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    active: { type: Boolean, default: true },
    title: { type: String, required: true },
    questions: [questionSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("AmaSession", amaSessionSchema);


const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },

    phone: {
      type: String,
      required: true,
      unique: true
    },

    role: {
      type: String,
      enum: ["worker", "contractor"],
      required: true
    },

    skills: [String],

    experience: String,

    location: String
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
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
    email: {
      type: String,
      trim: true,
      lowercase: true
    },
    company: String,
    location: String,
    established: Number,
    projectsCompleted: {
      type: Number,
      default: 0
    },
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0
    },
    isVerified: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
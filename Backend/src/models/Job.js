const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema(
  {
    title: String,
    location: String,
    workersNeeded: Number,
    wage: Number,

    contractorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },

    facilities: [String],

    status: {
      type: String,
      default: "active"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Job", jobSchema);
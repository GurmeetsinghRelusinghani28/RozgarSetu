const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema(
  {
    contractorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
        required: true,
    },

    projectTitle: String,
    location: String,
    startDate: Date,

    skillType: String,
    subSkill: String,

    workerCount: Number,
    wage: Number,

    facilities: {
      food: Boolean,
      accommodation: Boolean,
      insurance: Boolean,
      pf: Boolean,
    },

    description: String,

    images: [String],

    applicants: [
      {
        workerId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        appliedAt: {
          type: Date,
          default: Date.now,
        },
        status: {
          type: String,
          enum: ["pending", "accepted", "rejected"],
          default: "pending",
        },
      },
    ],

    status: {
      type: String,
      default: "open",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Project", projectSchema);
const mongoose = require("mongoose");

const normalizeProjectStatus = (value) => {
  if (typeof value !== "string") return value;
  const status = value.toUpperCase();
  return status === "CLOSED" ? "FILLED" : status;
};

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

    /* OLD CODE COMMENTED OUT FOR DEBUGGING
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
    */
    
    // NEW CODE
    status: {
      type: String,
      enum: ["OPEN", "FILLED", "IN_PROGRESS", "COMPLETED"],
      default: "OPEN",
      set: normalizeProjectStatus,
    },
  },
  { timestamps: true }
);

projectSchema.pre("validate", function normalizeStatus() {
  this.status = normalizeProjectStatus(this.status);
});

module.exports = mongoose.model("Project", projectSchema);

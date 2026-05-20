const Rating = require("../models/Rating");
const Project = require("../models/Project");
const User = require("../models/User");

exports.submitRating = async (req, res) => {
  try {
    const { toUserId, jobId, rating, review } = req.body;
    const fromUserId = req.user.id;

    // Validate project
    const project = await Project.findById(jobId);
    if (!project) return res.status(404).json({ success: false, message: "Job not found" });

    // Validate project is COMPLETED before rating
    if (project.status !== "COMPLETED") {
      return res.status(400).json({ success: false, message: "Job must be COMPLETED to submit a rating" });
    }

    // Check if already rated
    const existing = await Rating.findOne({ fromUserId, toUserId, jobId });
    if (existing) {
      return res.status(400).json({ success: false, message: "You have already rated for this job" });
    }

    const newRating = new Rating({
      fromUserId,
      toUserId,
      jobId,
      rating: Number(rating),
      review
    });

    await newRating.save();

    // Recalculate average rating for the target User
    const targetUser = await User.findById(toUserId);
    if (targetUser) {
      const currentRating = targetUser.rating || 0;
      const currentCount = targetUser.reviewCount || 0;

      const newCount = currentCount + 1;
      const newAverage = ((currentRating * currentCount) + Number(rating)) / newCount;

      targetUser.rating = Number(newAverage.toFixed(1));
      targetUser.reviewCount = newCount;
      await targetUser.save();
    }

    res.json({ success: true, message: "Rating submitted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

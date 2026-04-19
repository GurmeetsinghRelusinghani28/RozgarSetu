const express = require("express");
const {
  getWorkerProfile,
  updateWorkerProfile,
  getWorkerDashboard,
  getWorkerReviews,
  addOrUpdateWorkerReview,
  toggleSavedJob,
  applyToJob,
} = require("../controllers/workerProfileController");
const { verifyToken } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/profile", verifyToken, getWorkerProfile);
router.post("/profile", verifyToken, updateWorkerProfile);

router.get("/dashboard", verifyToken, getWorkerDashboard);
router.get("/reviews", verifyToken, getWorkerReviews);
router.post("/reviews/:workerId", verifyToken, addOrUpdateWorkerReview);
router.post("/dashboard/save/:projectId", verifyToken, toggleSavedJob);
router.post("/dashboard/apply/:projectId", verifyToken, applyToJob);

module.exports = router;

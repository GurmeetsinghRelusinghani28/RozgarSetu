const express = require("express");

const router = express.Router();

const {
  sendOtp,
  verifyOtp,
  getProfile,
  updateProfile
} = require("../controllers/authController");

router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);

router.get("/profile", require("../middleware/authMiddleware").verifyToken, getProfile);
router.put("/profile", require("../middleware/authMiddleware").verifyToken, updateProfile);

module.exports = router;
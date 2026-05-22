const express = require("express");
const multer = require("multer");
const { verifyToken } = require("../middleware/authMiddleware");
const {
  parseProfileFromText,
  parseProfileFromAudio,
  parseProjectFromText,
  parseProjectFromAudio,
} = require("../controllers/aiController");
const { rozgarMitra } = require("../controllers/aiChatController");

const router = express.Router();

// Configure multer for memory storage (for inline audio parsing)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

router.post("/parse-profile-text", verifyToken, parseProfileFromText);
router.post("/parse-profile-audio", verifyToken, upload.single("audio"), parseProfileFromAudio);
router.post("/parse-project-text", verifyToken, parseProjectFromText);
router.post("/parse-project-audio", verifyToken, upload.single("audio"), parseProjectFromAudio);
router.post("/rozgar-mitra", verifyToken, upload.single("audio"), rozgarMitra);

module.exports = router;

const express = require("express");
const { sendMessage, getChatHistory } = require("../controllers/chatController");
const { verifyToken } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/send", verifyToken, sendMessage);
router.get("/:jobId", verifyToken, getChatHistory);

module.exports = router;

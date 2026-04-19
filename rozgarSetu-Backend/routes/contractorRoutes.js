const express = require("express");
const router = express.Router();
const {verifyToken} = require("../middleware/authMiddleware");

const {
  getContractorProjects,
  updateApplicationStatus
} = require("../controllers/contractorController");

router.get("/projects",verifyToken,getContractorProjects);

router.post(
"/projects/:projectId/applicants/:workerId",
verifyToken,
updateApplicationStatus
);

module.exports = router;
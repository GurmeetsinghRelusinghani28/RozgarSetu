const express = require("express");
const { createProject, getProjects, getProjectById,applyToProject,getProjectApplicants, getContractorProjects, updateProjectStatus, deleteProject, updateApplicationStatus, getWorkerDetails, getWorkers } = require("../controllers/projectController");

const { verifyToken } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/create", verifyToken, createProject);

router.get("/", getProjects);

// NOTE: These must come before the /:id route, otherwise the paths are interpreted as an id.
router.get("/workers", verifyToken, getWorkers);
router.get("/contractor-projects", verifyToken, getContractorProjects);
router.post("/:id/apply", verifyToken, applyToProject);
router.get("/:id/applicants", verifyToken, getProjectApplicants);
router.put("/:projectId/applicants/:workerId/status", verifyToken, updateApplicationStatus);
router.get("/worker/:workerId", verifyToken, getWorkerDetails);
router.put("/:id/status", verifyToken, updateProjectStatus);
router.delete("/:id", verifyToken, deleteProject);

router.get("/:id", getProjectById);

module.exports = router;
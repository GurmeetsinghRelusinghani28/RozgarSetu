const express = require("express");
const { createProject, getProjects, getProjectById, applyToProject, rejectProject, getProjectApplicants, getContractorProjects, getContractorAllApplications, updateProjectStatus, deleteProject, updateApplicationStatus, getWorkerDetails, getWorkers } = require("../controllers/projectController");

const { verifyToken } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/create", verifyToken, createProject);

router.get("/", getProjects); // Open jobs search

// Routes without /:id param first
router.get("/workers", verifyToken, getWorkers);
router.get("/contractor-projects", verifyToken, getContractorProjects);
router.get("/contractor-applications", verifyToken, getContractorAllApplications);
router.get("/worker/:workerId", verifyToken, getWorkerDetails);

// Actions on a specific project
router.post("/:id/apply", verifyToken, applyToProject); // WORKER ACCEPTS
router.post("/:id/reject", verifyToken, rejectProject); // WORKER REJECTS
router.get("/:id/applicants", verifyToken, getProjectApplicants); // CONTRACTOR GETS ACCEPTED WORKERS
router.put("/:projectId/applicants/:workerId/status", verifyToken, updateApplicationStatus); // CONTRACTOR APPROVES
router.put("/:id/status", verifyToken, updateProjectStatus); // CONTRACTOR CHANGE STATUS
router.post("/:id/complete", verifyToken, updateProjectStatus); // ALIAS for complete
router.delete("/:id", verifyToken, deleteProject);

router.get("/:id", getProjectById);

module.exports = router;
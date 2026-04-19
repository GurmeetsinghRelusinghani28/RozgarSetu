const Job = require("../models/Job");

exports.getDashboard = async (req, res) => {
  const contractorId = req.params.id;

  const jobs = await Job.find({ contractorId });

  res.json({
    totalProjects: jobs.length,
    activeProjects: jobs.filter(j => j.status === "active").length,
    jobs
  });
};
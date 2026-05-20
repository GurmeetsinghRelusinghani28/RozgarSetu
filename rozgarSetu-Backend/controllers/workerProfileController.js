const WorkerProfile = require("../models/WorkerProfile");
const Project = require("../models/Project");
const User = require("../models/User");
const JobApplication = require("../models/JobApplication");

const getWorkerProfile = async (req, res) => {
  try {
    const profile = await WorkerProfile.findOne({ userId: req.user.id }).populate(
      "reviews.contractorId",
      "name company"
    );

    res.json({
      success: true,
      profile: profile || null,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getWorkerDashboard = async (req, res) => {
  try {
    const profile = await WorkerProfile.findOne({ userId: req.user.id });

    const skills = profile?.skills || [];
    const location = profile?.city;

    // Recommended: open jobs matching skills or location.
    const matchQuery = {
      status: { $regex: /^open$/i },
      $or: [
        { skillType: { $in: skills } },
        ...(location ? [{ location }] : []),
      ],
    };

    const recommendedJobs = await Project.find(matchQuery)
      .populate("contractorId", "name phone location")
      .sort({ createdAt: -1 })
      .limit(20);

    const savedJobs = profile?.savedJobs?.length
      ? await Project.find({ _id: { $in: profile.savedJobs } }).populate("contractorId", "name phone location")
      : [];

    // Robust way: fetch all applications from JobApplication model
    const jobApplications = await JobApplication.find({ workerId: req.user.id });
    const appliedJobIds = jobApplications.map(a => a.jobId);
    
    // Fetch project details for these applications
    const appliedProjects = await Project.find({ _id: { $in: appliedJobIds } })
      .populate("contractorId", "name phone location");

    // Helper to add status to projects
    const addStatus = (projects) => {
      return projects.map(job => {
        const application = jobApplications.find(a => a.jobId.toString() === job._id.toString());
        return {
          ...job.toObject(),
          applicationStatus: application?.status || 'PENDING',
          isApplied: !!application,
          appliedAt: application?.createdAt,
        };
      });
    };

    res.json({
      success: true,
      recommendedJobs: addStatus(recommendedJobs),
      savedJobs: addStatus(savedJobs),
      appliedJobs: addStatus(appliedProjects),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getWorkerReviews = async (req, res) => {
  try {
    const profile = await WorkerProfile.findOne({ userId: req.user.id }).populate(
      "reviews.contractorId",
      "name company"
    );

    if (!profile) {
      return res.status(404).json({ success: false, message: "Worker profile not found." });
    }

    res.json({ success: true, reviews: profile.reviews || [] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const addOrUpdateWorkerReview = async (req, res) => {
  try {
    const { workerId } = req.params;
    const { rating, comment } = req.body;

    if (req.user.role !== "contractor") {
      return res.status(403).json({ success: false, message: "Only contractors can submit reviews." });
    }

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: "Rating must be between 1 and 5." });
    }

    const profile = await WorkerProfile.findOne({ userId: workerId });
    if (!profile) {
      return res.status(404).json({ success: false, message: "Worker not found." });
    }

    const existing = profile.reviews.find((r) => r.contractorId.toString() === req.user.id);

    if (existing) {
      existing.rating = rating;
      existing.comment = comment;
      existing.createdAt = new Date();
    } else {
      profile.reviews.push({
        contractorId: req.user.id,
        rating,
        comment,
      });
    }

    await profile.save();

    const averageRating =
      profile.reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / profile.reviews.length;

    await User.findByIdAndUpdate(workerId, { rating: averageRating });

    res.json({ success: true, reviews: profile.reviews });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const toggleSavedJob = async (req, res) => {
  try {
    const { projectId } = req.params;

    const profile = await WorkerProfile.findOne({ userId: req.user.id });

    if (!profile) {
      return res.status(400).json({ success: false, message: "Complete your worker profile before saving jobs." });
    }

    const alreadySaved = profile.savedJobs.some((id) => id.toString() === projectId);

    if (alreadySaved) {
      profile.savedJobs = profile.savedJobs.filter((id) => id.toString() !== projectId);
    } else {
      profile.savedJobs.push(projectId);
    }

    await profile.save();

    res.json({ success: true, savedJobs: profile.savedJobs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const applyToJob = async (req, res) => {
  try {
    const { projectId } = req.params;

    const profile = await WorkerProfile.findOne({ userId: req.user.id });

    if (!profile) {
      return res.status(400).json({ success: false, message: "Complete your worker profile before applying." });
    }

    const alreadyApplied = profile.appliedJobs.some((id) => id.toString() === projectId);

    if (!alreadyApplied) {
      profile.appliedJobs.push(projectId);
      await profile.save();
    }

    // Track centrally in new JobApplication flow
    const JobApplication = require("../models/JobApplication");
    const existingApplication = await JobApplication.findOne({ jobId: projectId, workerId: req.user.id });
    if (!existingApplication) {
      const application = new JobApplication({
        jobId: projectId,
        workerId: req.user.id,
        status: "PENDING"
      });
      await application.save();
    }

    // Keep old behavior as backward compatibility
    const Project = require("../models/Project");
    const project = await Project.findById(projectId);
    if (project) {
      const alreadyInProject = project.applicants?.some((a) => a.workerId?.toString() === req.user.id);
      if (!alreadyInProject) {
        project.applicants = project.applicants || [];
        project.applicants.push({ workerId: req.user.id });
        await project.save();
      }
    }

    res.json({ success: true, appliedJobs: profile.appliedJobs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateWorkerProfile = async (req, res) => {
  try {
    const { name, skills, experience, city } = req.body;

    const updates = {
      name,
      skills,
      experience,
      city,
    };

    Object.keys(updates).forEach((key) => {
      if (updates[key] === undefined) delete updates[key];
    });

    let profile = await WorkerProfile.findOneAndUpdate(
      { userId: req.user.id },
      { $set: updates },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    // Make sure the User record has a name, and keep it in sync for convenience
    if (name) {
      await User.findByIdAndUpdate(req.user.id, { name }, { new: true });
    }

    res.json({ success: true, profile });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getWorkerProfile,
  updateWorkerProfile,
  getWorkerDashboard,
  getWorkerReviews,
  addOrUpdateWorkerReview,
  toggleSavedJob,
  applyToJob,
};

const Project = require("../models/Project");
const WorkerProfile = require("../models/WorkerProfile");
const User = require("../models/User");
const JobApplication = require("../models/JobApplication");

const normalizeProjectStatus = (value) => {
  if (typeof value !== "string") return value;
  const status = value.toUpperCase();
  return status === "CLOSED" ? "FILLED" : status;
};

/* CREATE PROJECT */
const createProject = async (req,res)=>{
  try{
    const project = new Project({
      contractorId:req.user.id,
      projectTitle:req.body.projectTitle,
      location:req.body.location,
      startDate:req.body.startDate,
      skillType:req.body.skillType,
      subSkill:req.body.subSkill,
      workerCount:req.body.workerCount,
      wage:req.body.wage,
      facilities:{
        food:req.body.food,
        accommodation:req.body.accommodation,
        insurance:req.body.insurance,
        pf:req.body.pf
      },
      description:req.body.description,
      images:req.body.images,
      status: "OPEN" // New field
    });
    await project.save();
    res.json({ success:true, project });
  }catch(err){
    res.status(500).json({ success:false, message:err.message });
  }
};

/* GET ALL PROJECTS */
const getProjects = async (req,res)=>{
  try{
    const { skill, search, location, status } = req.query;
    const filter = {};
    filter.status = normalizeProjectStatus(status) || 'OPEN';

    if (skill && skill !== 'allSkills') {
      filter.$or = [{ skillType: skill }, { subSkill: skill }];
    }
    if (location) {
      filter.location = { $regex: location, $options: 'i' };
    }
    if (search) {
      const regex = { $regex: search, $options: 'i' };
      filter.$or = [
        ...(filter.$or || []),
        { projectTitle: regex },
        { location: regex },
        { description: regex },
      ];
    }
    const projects = await Project.find(filter)
      .populate("contractorId","name phone location")
      .sort({createdAt:-1});
    res.json({ success:true, projects });
  }catch(err){
    res.status(500).json({ success:false, message:err.message });
  }
};

/* GET SINGLE PROJECT */
const getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    res.json({ success: true, project });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* APPLY TO PROJECT (Worker Accept Flow) */
const applyToProject = async (req, res) => {
  try {
    const projectId = req.params.id;
    const workerId = req.user.id;

    /* OLD CODE
    const profile = await WorkerProfile.findOne({ userId: workerId });
    ...
    project.applicants.push({ workerId });
    ...
    */
    
    // NEW CODE (JobApplication Model)
    const profile = await WorkerProfile.findOne({ userId: workerId });
    if (!profile) {
      return res.status(400).json({ success: false, message: "Complete your worker profile before applying." });
    }

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ success: false, message: "Project not found" });

    // Check if limits exceeded
    const applicationsCount = await JobApplication.countDocuments({ jobId: projectId, status: { $ne: 'REJECTED' } });
    if (project.workerCount && applicationsCount >= project.workerCount) {
      // Mark as FILLED if at capacity
      project.status = "FILLED";
      await project.save();
      return res.status(400).json({ success: false, message: "Job is already full." });
    }

    const existingApplication = await JobApplication.findOne({ jobId: projectId, workerId });
    if (existingApplication) {
      if (existingApplication.status === "REJECTED") {
        existingApplication.status = "PENDING";
        await existingApplication.save();
        return res.json({ success: true, message: "Job application resent." });
      }
      return res.status(400).json({ success: false, message: "Already applied." });
    }

    const application = new JobApplication({
      jobId: projectId,
      workerId,
      status: "PENDING"
    });
    
    await application.save();

    res.json({ success: true, message: "Job Applied successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* REJECT PROJECT (Worker Reject Flow) */
const rejectProject = async (req, res) => {
  try {
    const projectId = req.params.id;
    const workerId = req.user.id;

    let application = await JobApplication.findOne({ jobId: projectId, workerId });
    if (application) {
      application.status = "REJECTED";
      await application.save();
    } else {
      application = new JobApplication({
        jobId: projectId,
        workerId,
        status: "REJECTED"
      });
      await application.save();
    }

    res.json({ success: true, message: "Job Rejected successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* GET PROJECT APPLICANTS (Contractor views accepted workers) */
const getProjectApplicants = async (req, res) => {
  try {
    const projectId = req.params.id;

    /* OLD CODE 
    const project = await Project.findById(req.params.id);
    const applicantsWithDetails = project.applicants.map(...)
    */
    
    // NEW CODE (Fetch from JobApplication)
    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ success: false, message: "Project not found" });

    if (project.contractorId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    const applications = await JobApplication.find({ jobId: projectId, status: { $ne: 'REJECTED' } })
      .populate({
        path: 'workerId',
        select: 'name phone location rating'
      });

    // Formatting it nicely to emulate old `workerProfile` logic
    const applicantsWithDetails = await Promise.all(
      applications.map(async (app) => {
        const workerProfile = await WorkerProfile.findOne({ userId: app.workerId._id }).lean();
        return {
          _id: app._id,
          workerId: app.workerId._id,
          appliedAt: app.createdAt,
          status: app.status,
          user: app.workerId, // populated user details (name, rating, phone)
          workerProfile
        };
      })
    );

    res.json({ success: true, applicants: applicantsWithDetails });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* GET CONTRACTOR PROJECTS */
const getContractorProjects = async (req,res)=>{
  try {
    const projects = await Project.find({
      contractorId: req.user.id
    }).sort({ createdAt: -1 });

    res.json({ success: true, projects });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* GET ALL APPLICATIONS FOR ALL CONTRACTOR PROJECTS */
const getContractorAllApplications = async (req, res) => {
  try {
    const projects = await Project.find({ contractorId: req.user.id }).select('_id projectTitle location');
    const projectIds = projects.map(p => p._id);
    const projectTitles = projects.reduce((acc, p) => ({ ...acc, [p._id]: p }), {});

    const applications = await JobApplication.find({ jobId: { $in: projectIds } })
      .populate({
        path: 'workerId',
        select: 'name phone location rating'
      }).sort({ createdAt: -1 });

    const formattedApps = await Promise.all(
      applications.map(async (app) => {
        const workerProfile = await WorkerProfile.findOne({ userId: app.workerId._id }).lean();
        const p = projectTitles[app.jobId];
        return {
          id: app._id,
          workerName: workerProfile?.name || app.workerId.name || 'Worker',
          skill: workerProfile?.skills?.[0] || 'helper',
          experience: workerProfile?.experience || 0,
          expectedWage: workerProfile?.expectedWage || 0,
          rating: app.workerId.rating || 0,
          location: workerProfile?.city || app.workerId.location || 'Unknown',
          jobTitle: p?.projectTitle || 'Project',
          status: app.status,
          projectId: app.jobId,
          workerId: app.workerId._id
        };
      })
    );

    res.json({ success: true, applications: formattedApps });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* UPDATE PROJECT STATUS (INCLUDING COMPLETED) */
const updateProjectStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const status = normalizeProjectStatus(req.body.status);

    /* OLD CODE 
    if (!['open', 'closed'].includes(status)) ...
    */
    
    // NEW CODE 
    const validStatuses = ['OPEN', 'FILLED', 'IN_PROGRESS', 'COMPLETED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value' });
    }

    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    if (project.contractorId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    project.status = status;
    await project.save();

    res.json({ success: true, project });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* UPDATE APPLICATION STATUS (Contractor Approves worker) */
const updateApplicationStatus = async (req, res) => {
  try {
    const { projectId, workerId } = req.params;
    const { status } = req.body; // e.g. "APPROVED"

    if (!['ACCEPTED', 'REJECTED', 'APPROVED'].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }

    const application = await JobApplication.findOne({ jobId: projectId, workerId: workerId });
    if (!application) return res.status(404).json({ success: false, message: "Application not found" });

    const project = await Project.findById(projectId);
    if (project.contractorId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    application.status = status;
    await application.save();

    res.json({ success: true, message: `Application updated to ${status}` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;
    const project = await Project.findById(id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    if (project.contractorId.toString() !== req.user.id) return res.status(403).json({ success: false, message: 'Unauthorized' });

    await project.deleteOne();
    // also clean up applications
    await JobApplication.deleteMany({ jobId: id });

    res.json({ success: true, message: 'Project deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getWorkerDetails = async (req, res) => {
  try {
    const { workerId } = req.params;
    const workerProfile = await WorkerProfile.findOne({ userId: workerId })
      .populate('userId', 'name phone location rating')
      .populate('reviews.contractorId', 'name company');

    if (!workerProfile) return res.status(404).json({ success: false, message: "Worker not found" });
    res.json({ success: true, worker: workerProfile });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getWorkers = async (req, res) => {
  // same implementation as old code
  try {
    const { skill, location, search } = req.query;
    const filter = {};
    if (skill) filter.skills = { $in: [skill] };
    if (location) filter.city = { $regex: location, $options: 'i' };
    if (search) {
      const regex = { $regex: search, $options: 'i' };
      filter.$or = [{ name: regex }, { skills: { $in: [new RegExp(search, 'i')] } }];
    }

    const workers = await WorkerProfile.find(filter)
      .populate('userId', 'name phone location rating')
      .sort({ createdAt: -1 });

    const workersWithDetails = workers.map(worker => ({
      id: worker.userId?._id,
      name: worker.name,
      skills: worker.skills,
      rating: worker.userId?.rating || 0,
      location: worker.city,
      experience: worker.experience,
      phone: worker.userId?.phone,
    }));

    // Highly recommend (sort) workers by rating to other contractors!
    workersWithDetails.sort((a, b) => b.rating - a.rating);

    res.json({ success: true, workers: workersWithDetails });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { createProject, getProjects, getProjectById, applyToProject, rejectProject, getProjectApplicants, getContractorProjects, getContractorAllApplications, updateProjectStatus, deleteProject, updateApplicationStatus, getWorkerDetails, getWorkers };

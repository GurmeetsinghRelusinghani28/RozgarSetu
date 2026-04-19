const Project = require("../models/Project");
const WorkerProfile = require("../models/WorkerProfile");
const User = require("../models/User");

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
  images:req.body.images

 });

 await project.save();

 res.json({
  success:true,
  project
 });

 }catch(err){

 res.status(500).json({
  success:false,
  message:err.message
 });

 }

};

/* GET ALL PROJECTS */

const getProjects = async (req,res)=>{
  try{
    const { skill, search, location, status } = req.query;

    const filter = {};

    // Only return open jobs by default
    filter.status = status || 'open';

    if (skill && skill !== 'allSkills') {
      filter.$or = [
        { skillType: skill },
        { subSkill: skill }
      ];
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

    res.json({
      success:true,
      projects
    });

  }catch(err){

    res.status(500).json({
      success:false,
      message:err.message
    });

  }

};

/* GET SINGLE PROJECT */

const getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    res.json({
      success: true,
      project,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const applyToProject = async (req, res) => {
  try {
    const projectId = req.params.id;
    const profile = await WorkerProfile.findOne({ userId: req.user.id });

    if (!profile) {
      return res.status(400).json({ success: false, message: "Complete your worker profile before applying." });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found" });
    }

    const alreadyApplied = profile.appliedJobs.some((id) => id.toString() === projectId);
    if (!alreadyApplied) {
      profile.appliedJobs.push(projectId);
      await profile.save();
    }

    const alreadyInProject = project.applicants?.some((a) => a.workerId?.toString() === req.user.id);
    if (!alreadyInProject) {
      project.applicants = project.applicants || [];
      project.applicants.push({ workerId: req.user.id });
      await project.save();
    }

    res.json({ success: true, appliedJobs: profile.appliedJobs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getProjectApplicants = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found" });
    }

    if (project.contractorId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    const applicantsWithDetails = await Promise.all(
      (project.applicants || []).map(async (applicant) => {
        const workerProfile = await WorkerProfile.findOne({ userId: applicant.workerId })
          .populate('userId', 'name phone location rating')
          .lean();
        return {
          ...applicant,
          workerProfile,
        };
      })
    );

    res.json({ success: true, applicants: applicantsWithDetails });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getContractorProjects = async (req,res)=>{
  try {
    const projects = await Project.find({
      contractorId: req.user.id
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      projects
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

const updateProjectStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['open', 'closed'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value'
      });
    }

    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    if (project.contractorId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    project.status = status;
    await project.save();

    res.json({
      success: true,
      project
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

const updateApplicationStatus = async (req, res) => {
  try {
    const { projectId, workerId } = req.params;
    const { status } = req.body;

    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found" });
    }

    if (project.contractorId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    const applicant = project.applicants.find(a => a.workerId.toString() === workerId);
    if (!applicant) {
      return res.status(404).json({ success: false, message: "Application not found" });
    }

    applicant.status = status;
    await project.save();

    res.json({ success: true, message: `Application ${status}` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;

    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    if (project.contractorId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    await project.deleteOne();

    res.json({
      success: true,
      message: 'Project deleted'
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

const getWorkerDetails = async (req, res) => {
  try {
    const { workerId } = req.params;

    const workerProfile = await WorkerProfile.findOne({ userId: workerId })
      .populate('userId', 'name phone location rating')
      .populate('reviews.contractorId', 'name company');

    if (!workerProfile) {
      return res.status(404).json({ success: false, message: "Worker not found" });
    }

    res.json({ success: true, worker: workerProfile });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getWorkers = async (req, res) => {
  try {
    const { skill, location, search } = req.query;

    const filter = {};

    if (skill) {
      filter.skills = { $in: [skill] };
    }

    if (location) {
      filter.city = { $regex: location, $options: 'i' };
    }

    if (search) {
      const regex = { $regex: search, $options: 'i' };
      filter.$or = [
        { name: regex },
        { skills: { $in: [new RegExp(search, 'i')] } },
      ];
    }

    const workers = await WorkerProfile.find(filter)
      .populate('userId', 'name phone location rating')
      .sort({ createdAt: -1 });

    const workersWithDetails = workers.map(worker => ({
      id: worker.userId._id,
      name: worker.name,
      skills: worker.skills,
      rating: worker.userId.rating || 0,
      location: worker.city,
      experience: worker.experience,
      phone: worker.userId.phone,
    }));

    res.json({ success: true, workers: workersWithDetails });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { createProject, getProjects, getProjectById, applyToProject, getProjectApplicants, getContractorProjects, updateProjectStatus, deleteProject, updateApplicationStatus, getWorkerDetails, getWorkers };
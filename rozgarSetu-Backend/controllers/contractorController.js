const Project = require("../models/Project");

const getContractorProjects = async (req,res)=>{
  try{

    const projects = await Project.find({
      contractorId:req.user.id
    }).populate("applicants.workerId","name phone");

    res.json({
      success:true,
      projects
    });

  }catch(error){
    res.status(500).json({
      success:false,
      message:error.message
    })
  }
}

const updateApplicationStatus = async (req,res)=>{

  try{

    const {projectId,workerId} = req.params;
    const {status} = req.body;

    if(!["accepted","rejected"].includes(status)){
      return res.status(400).json({
        success:false,
        message:"Invalid status"
      });
    }

    const project = await Project.findById(projectId);

    const applicant = project.applicants.find(
      a => a.workerId.toString() === workerId
    );

    if(!applicant){
      return res.status(404).json({
        success:false,
        message:"Applicant not found"
      });
    }

    applicant.status = status;

    await project.save();

    res.json({
      success:true,
      message:`Worker ${status}`
    });

  }catch(error){
    res.status(500).json({
      success:false,
      message:error.message
    })
  }

}
module.exports = {getContractorProjects,updateApplicationStatus}
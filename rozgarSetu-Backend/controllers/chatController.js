const Message = require("../models/Message");
const Project = require("../models/Project");

// Send simple REST chat message
exports.sendMessage = async (req, res) => {
  try {
    const { receiverId, jobId, message } = req.body;
    const senderId = req.user.id;

    // Check project exists
    const project = await Project.findById(jobId);
    if (!project) return res.status(404).json({ success: false, message: "Job not found" });

    const newMessage = new Message({
      senderId,
      receiverId,
      jobId,
      message,
    });
    
    await newMessage.save();

    res.json({
      success: true,
      data: newMessage
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get chat history for a specific job/room
exports.getChatHistory = async (req, res) => {
  try {
    const { jobId } = req.params;
    // user could be either sender or receiver
    const userId = req.user.id;

    const messages = await Message.find({
      jobId,
      $or: [{ senderId: userId }, { receiverId: userId }]
    }).sort({ createdAt: 1 });

    res.json({
      success: true,
      messages
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// const User = require("../models/User");
// const generateOTP = require("../utils/otp");
// const jwt = require("jsonwebtoken");

// let otpStore = {};

// // SEND OTP
// // exports.sendOtp = async (req, res) => {
// //   try {
// //     const { phone } = req.body;

// //     if (!phone) {
// //       return res.status(400).json({
// //         success: false,
// //         message: "Phone number required"
// //       });
// //     }

// //     const otp = generateOTP();

// //     otpStore[phone] = otp;

// //     console.log("OTP:", otp);

// //     res.json({
// //       success: true,
// //       message: "OTP sent",
// //       otp
// //     });

// //   } catch (error) {
// //     res.status(500).json({
// //       success: false,
// //       message: error.message
// //     });
// //   }
// // };

// exports.sendOtp = async (req, res) => {
//   try {
//     console.log(req.body);
//     if (!req.body) {
//       return res.status(400).json({
//         success: false,
//         message: "Request body missing"
//       });
//     }

//     const { phone } = req.body;

//     if (!phone) {
//       return res.status(400).json({
//         success: false,
//         message: "Phone number required"
//       });
//     }

//     const otp = generateOTP();

//     otpStore[phone] = otp;

//     console.log("OTP:", otp);

//     res.json({
//       success: true,
//       message: "OTP sent",
//       otp
//     });

//   } catch (error) {

//     res.status(500).json({
//       success: false,
//       message: error.message
//     });

//   }
// };

// // VERIFY OTP + LOGIN / SIGNUP
// exports.verifyOtp = async (req, res) => {
//   try {

//     const { name, phone, otp, role } = req.body;

//     if (!otpStore[phone] || otpStore[phone] !== otp) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid OTP"
//       });
//     }

//     let user = await User.findOne({ phone });

//     if (!user) {
//       user = await User.create({
//         name,
//         phone,
//         role,
//         isVerified: true
//       });
//     }

//     const token = jwt.sign(
//       { id: user._id, role: user.role },
//       process.env.JWT_SECRET,
//       { expiresIn: "7d" }
//     );

//     res.json({
//       success: true,
//       message: "Login successful",
//       token,
//       user
//     });

//   } catch (error) {

//     res.status(500).json({
//       success: false,
//       message: error.message
//     });

//   }
// };

const jwt = require("jsonwebtoken");
const User = require("../models/User");
const WorkerProfile = require("../models/WorkerProfile");

// In-memory OTP store (for development)
// In production, use Redis or database
const otpStore = new Map();
const OTP_EXPIRY_TIME = 10 * 60 * 1000; // 10 minutes

// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Twilio SMS sending
const sendSMSViaTwilio = async (phone, otp) => {
  try {
    // Check if Twilio is configured
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE_NUMBER) {
      console.warn("⚠️  Twilio not configured. SMS will not be sent.");
      return false;
    }

    const twilio = require("twilio");
    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    const fullPhone = `+91${phone}`;

    await client.messages.create({
      body: `Your RozgarSetu OTP is ${otp}. Valid for 10 minutes. Do not share this OTP.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: fullPhone,
    });

    console.log(`✅ SMS sent to ${fullPhone}`);
    return true;
  } catch (error) {
    console.error("❌ Twilio SMS Error:", error.message);
    return false;
  }
};

/* ---------------- SEND OTP ---------------- */

exports.sendOtp = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Phone number required"
      });
    }

    // Validate Indian phone number (10 digits, starts with 6-9)
    if (!/^\d{10}$/.test(phone) || !/^[6-9]/.test(phone)) {
      return res.status(400).json({
        success: false,
        message: "Invalid phone number. Please enter a valid 10-digit Indian mobile number."
      });
    }

    const otp = generateOTP();
    
    // Store OTP with expiry
    otpStore.set(phone, {
      otp,
      createdAt: Date.now(),
      attempts: 0
    });

    // Clear OTP after expiry time
    setTimeout(() => {
      otpStore.delete(phone);
    }, OTP_EXPIRY_TIME);

    // Try to send SMS via Twilio
    const smsSent = await sendSMSViaTwilio(phone, otp);

    // In development, also log to console
    console.log(`🔐 OTP for ${phone}: ${otp}`);

    res.json({
      success: true,
      message: smsSent ? "OTP sent via SMS" : "OTP sent (check console in development)",
      // For development only - remove in production
      otp: process.env.NODE_ENV === 'development' ? otp : undefined
    });

  } catch (error) {
    console.error("Send OTP Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to send OTP"
    });
  }
};

/* ---------------- GET PROFILE ---------------- */

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-__v');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/* ---------------- UPDATE PROFILE ---------------- */

exports.updateProfile = async (req, res) => {
  try {
    const updates = {
      role: "contractor",
      name: req.body.name,
      email: req.body.email,
      company: req.body.company,
      location: req.body.location,
      established: req.body.established,
      projectsCompleted: req.body.projectsCompleted,
      rating: req.body.rating
    };

    // Remove undefined keys so we don't overwrite with undefined.
    Object.keys(updates).forEach((key) => updates[key] === undefined && delete updates[key]);

    const user = await User.findByIdAndUpdate(req.user.id, updates, {
      new: true,
      runValidators: true
    }).select('-__v');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


/* ---------------- VERIFY OTP + LOGIN/SIGNUP ---------------- */

exports.verifyOtp = async (req, res) => {

  try {

    const { name, phone, otp, role } = req.body;
    const effectiveRole = role || "worker";

    // Validate required fields
    if (!phone || !otp) {
      return res.status(400).json({
        success: false,
        message: "Phone number and OTP are required"
      });
    }

    // Check if OTP exists and is valid
    const otpData = otpStore.get(phone);

    if (!otpData) {
      return res.status(400).json({
        success: false,
        message: "OTP expired or invalid. Please request a new OTP."
      });
    }

    // Check if OTP is correct
    if (otpData.otp !== otp) {
      otpData.attempts += 1;
      
      if (otpData.attempts >= 3) {
        otpStore.delete(phone);
        return res.status(400).json({
          success: false,
          message: "Too many failed attempts. Please request a new OTP."
        });
      }

      return res.status(400).json({
        success: false,
        message: `Invalid OTP. ${3 - otpData.attempts} attempts remaining.`
      });
    }

    // OTP is valid, delete it
    otpStore.delete(phone);

    // Find or create user
    let user = await User.findOne({ phone });

    if (!user) {
      user = await User.create({
        name,
        phone,
        role: effectiveRole,
        isVerified: true
      });

      // Create worker profile if role is worker
      if (effectiveRole === "worker") {
        await WorkerProfile.create({
          userId: user._id,
          name: name,
          role: "worker"
        });
      }
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user._id,
        role: user.role || effectiveRole,
      },
      process.env.JWT_SECRET || "your-secret-key-here",
      { expiresIn: "7d" }
    );

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        role: user.role || effectiveRole,
      }
    });

  } catch (error) {

    console.error("OTP verification error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "OTP verification failed"
    });

  }

};
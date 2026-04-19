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

const client = require("../config/twilio");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const WorkerProfile = require("../models/WorkerProfile");

const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID;


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

    if (!/^[6-9]\d{9}$/.test(phone)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Indian mobile number"
      });
    }

    const fullPhone = `+91${phone}`;

    await client.verify.v2
      .services(serviceSid)
      .verifications.create({
        to: fullPhone,
        channel: "sms"
      });

    res.json({
      success: true,
      message: "OTP sent to mobile number"
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
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


/* ---------------- VERIFY OTP ---------------- */

exports.verifyOtp = async (req, res) => {

  try {

    const { name, phone, otp, role } = req.body;
    const effectiveRole = role || "worker";

    const fullPhone = `+91${phone}`;

    const verificationCheck = await client.verify.v2
      .services(serviceSid)
      .verificationChecks.create({
        to: fullPhone,
        code: otp
      });

    if (verificationCheck.status !== "approved") {

      return res.status(400).json({
        success: false,
        message: "Invalid OTP"
      });

    }

    let user = await User.findOne({ phone });

    if (!user) {
      user = await User.create({
        name,
        phone,
        role: effectiveRole,
      });

      // Create worker profile if role is worker
      if (effectiveRole === "worker") {
        await WorkerProfile.create({
          userId: user._id,
          name: name,
          role: "worker",
        });
      }
    }

    const token = jwt.sign(
      {
        id: user._id,
        role: effectiveRole,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      success: true,
      message: "Login successful",
      token,
      user
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }

};
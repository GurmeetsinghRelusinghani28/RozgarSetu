const User = require("../models/User");
const generateOTP = require("../utils/generateOTP");

let otpStore = {};

exports.sendOTP = async (req, res) => {
  const { phone } = req.body;

  const otp = generateOTP();

  otpStore[phone] = otp;

  console.log("OTP:", otp);

  res.json({
    success: true,
    message: "OTP sent",
    otp
  });
};

exports.verifyOTP = async (req, res) => {
  const { phone, otp, name, role } = req.body;

  if (otpStore[phone] !== otp) {
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
      role
    });
  }

  res.json({
    success: true,
    user
  });
};
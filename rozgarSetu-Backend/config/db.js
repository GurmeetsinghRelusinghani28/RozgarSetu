const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is not set");
    }

    await mongoose.connect(process.env.MONGO_URI, {
      dbName: process.env.MONGO_DB_NAME || "rozgarsetu",
      serverSelectionTimeoutMS: 15000,
    });

    console.log("MongoDB Connected");
  } catch (error) {
    console.error("DB Error:", error.message);
    console.error(
      "If you are using MongoDB Atlas, add your current public IP in Atlas > Network Access."
    );
    process.exit(1);
  }
};

module.exports = connectDB;

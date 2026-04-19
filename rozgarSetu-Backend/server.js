// const express = require("express");
// const cors = require("cors");
// const dotenv = require("dotenv");

// const connectDB = require("./config/db");

// dotenv.config();

// const app = express();

// connectDB();

// app.use(cors());
// app.use(express.json());

// app.use("/api/auth", require("./routes/authRoutes"));

// app.get("/", (req, res) => {
//   res.send("RozgarSetu API Running");
// });

// const PORT = process.env.PORT || 5000;

// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });

const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

const projectRoutes = require("./routes/projectRoutes");
const connectDB = require("./config/db");

dotenv.config();

const app = express();

connectDB();

app.use(cors());
app.use(express.json({ limit: "10mb" }));

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/projects", projectRoutes);
app.use("/api/worker", require("./routes/workerProfileRoutes"));

app.get("/", (req, res) => {
  res.send("RozgarSetu API Running");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
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
const http = require("http");
const { Server } = require("socket.io");

const projectRoutes = require("./routes/projectRoutes");
const connectDB = require("./config/db");
const Message = require("./models/Message");

dotenv.config();

const app = express();

connectDB();

app.use(cors());
app.use(express.json({ limit: "10mb" }));

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/projects", projectRoutes);
app.use("/api/worker", require("./routes/workerProfileRoutes"));
// NEW ROUTES
app.use("/api/chat", require("./routes/chatRoutes"));
app.use("/api/ratings", require("./routes/ratingRoutes"));
app.use("/api/ai", require("./routes/aiRoutes"));

app.get("/", (req, res) => {
  res.send("RozgarSetu API Running (With Socket.io)");
});

const PORT = process.env.PORT || 5001;

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

// Socket.io Implementation
io.on("connection", (socket) => {
  console.log("🟢 User connected:", socket.id);

  socket.on("join_room", (data) => {
    // data should contain jobId
    const room = `room_${data.jobId}`;
    socket.join(room);
    console.log(`👤 User joined ${room}`);
  });

  socket.on("send_message", async (data) => {
    // data = { senderId, receiverId, jobId, message }
    try {
      // 1. Save to DB
      const newMessage = new Message({
        senderId: data.senderId,
        receiverId: data.receiverId,
        jobId: data.jobId,
        message: data.message,
      });
      await newMessage.save();

      // 2. Broadcast to room
      const room = `room_${data.jobId}`;
      io.to(room).emit("receive_message", newMessage);
      console.log(`📨 Message sent in ${room}`);
    } catch (err) {
      console.error("Socket send_message error:", err.message);
    }
  });

  socket.on("disconnect", () => {
    console.log("🔴 User disconnected:", socket.id);
  });
});

/* OLD CODE 
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
*/

// NEW CODE - using the http server wrapping the express app
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
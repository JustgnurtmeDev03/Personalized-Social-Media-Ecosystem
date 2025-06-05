const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");

module.exports = (httpServer) => {
  const io = new Server(httpServer, {
    cors: { origin: "http://localhost:3000" }, // Điều chỉnh theo URL frontend
  });

  // Middleware xác thực socket bằng JWT
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error("Authentication error"));
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded;
      next();
    } catch (error) {
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.user.id;
    socket.join(userId); // Mỗi user join room riêng dựa trên ID

    console.log(`User ${userId} connected`);

    socket.on("disconnect", () => {
      console.log(`User ${userId} disconnected`);
    });
  });

  return io;
};

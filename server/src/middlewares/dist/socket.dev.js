"use strict";

var _require = require("socket.io"),
    Server = _require.Server;

var jwt = require("jsonwebtoken");

module.exports = function (httpServer) {
  var io = new Server(httpServer, {
    cors: {
      origin: "http://localhost:3000"
    } // Điều chỉnh theo URL frontend

  }); // Middleware xác thực socket bằng JWT

  io.use(function (socket, next) {
    var token = socket.handshake.auth.token;
    if (!token) return next(new Error("Authentication error"));

    try {
      var decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded;
      next();
    } catch (error) {
      next(new Error("Authentication error"));
    }
  });
  io.on("connection", function (socket) {
    var userId = socket.user.id;
    socket.join(userId); // Mỗi user join room riêng dựa trên ID

    console.log("User ".concat(userId, " connected"));
    socket.on("disconnect", function () {
      console.log("User ".concat(userId, " disconnected"));
    });
  });
  return io;
};
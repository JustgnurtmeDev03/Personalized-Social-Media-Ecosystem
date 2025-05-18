import express from "express";
import bodyParser from "body-parser";
import "module-alias/register";
import connectDB from "./config/db";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/authRoutes";
import userRoutes from "./routes/userRoutes";
import threadRoutes from "./routes/threadRoutes";
import { errorHandler } from "./middlewares/errorMiddleware";
import { AppError } from "./utils/AppError";
import { checkCloudinaryConnection } from "./config/cloudinary";
import path from "path";

const app = express();
require("dotenv").config();

// Connect to MongoDB
connectDB();

// Connect to Cloudinary
checkCloudinaryConnection();

app.use(cookieParser());

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Cấu hình EJS
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Routes
app.use("/api/auth", authRoutes);
// app.use("/api/post", postRoutes);
app.use("/api/users", userRoutes);
app.use("/api/threads", threadRoutes);

// Xử lý route không tìm thấy
app.all("*", (req, res, next) => {
  next(new AppError(`Cannot find ${req.originalUrl} on this server`, 404));
});

// Middleware xử lý lỗi
app.use(errorHandler);

export default app;

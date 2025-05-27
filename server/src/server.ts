import dotenv from "dotenv";
import app from "./app";

dotenv.config({
  path: `.env.${process.env.NODE_ENV || "development"}`,
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION! Shutting down...");
  console.error(err.name, err.message);
  process.exit(1);
});

process.on("unhandledRejection", (err: Error) => {
  console.error("UNHANDLED REJECTION! Shuting down...");
  console.error(err.message);
  server.close(() => process.exit(1));
});

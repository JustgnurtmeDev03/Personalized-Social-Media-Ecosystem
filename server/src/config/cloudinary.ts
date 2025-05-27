import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// Hàm kiểm tra kết nối Cloudinary
export const checkCloudinaryConnection = async (): Promise<void> => {
  try {
    const result = await cloudinary.api.ping();
    console.log("✅ Cloudinary connection successful:", result);
  } catch (error) {
    console.error("❌ Cloudinary connection failed:", error);
    throw new Error("Failed to connect to Cloudinary");
  }
};

export default cloudinary;

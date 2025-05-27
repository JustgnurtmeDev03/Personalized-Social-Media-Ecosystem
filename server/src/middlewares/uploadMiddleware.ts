import multer, { FileFilterCallback } from "multer";
import path from "path";
import { Request } from "express";

// Kiểm tra định dạng file ảnh và video
const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  const allowedMimeTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
    "video/mp4",
    "video/mpeg",
    "video/webm",
    "video/quicktime", // Cho .mov
    "video/x-msvideo", // Cho .avi
  ];

  // Danh sách phần mở rộng được phép (không bao gồm dấu chấm)
  const allowedExtensions = [
    "jpeg",
    "jpg",
    "png",
    "gif",
    "webp",
    "mp4",
    "mpeg",
    "webm",
    "mov",
    "avi",
  ];

  // Lấy phần mở rộng file (bỏ dấu chấm)
  const extname = path
    .extname(file.originalname)
    .toLowerCase()
    .replace(/^\./, "");

  // Logging để debug
  console.log(
    `File upload attempt: mimetype=${file.mimetype}, extname=${extname}, filename=${file.originalname}`
  );

  // Kiểm tra mimetype và extname
  if (
    allowedMimeTypes.includes(file.mimetype) &&
    allowedExtensions.includes(extname)
  ) {
    return cb(null, true);
  } else {
    const errorMessage = `Invalid file type: mimetype=${
      file.mimetype
    }, extname=.${extname}. Allowed mimetypes: ${allowedMimeTypes.join(", ")}`;
    console.error(errorMessage);
    cb(new Error(errorMessage));
  }
};

//Tạo instance của multer
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: fileFilter,
  limits: { fileSize: 100 * 1024 * 1024 },
});

export default upload;

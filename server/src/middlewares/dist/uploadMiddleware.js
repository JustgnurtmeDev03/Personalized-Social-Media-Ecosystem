"use strict";
exports.__esModule = true;
var multer_1 = require("multer");
var path_1 = require("path");
// Kiểm tra định dạng file ảnh và video
var fileFilter = function (req, file, cb) {
    var allowedMimeTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
        "image/webp",
        "video/mp4",
        "video/mpeg",
        "video/webm",
        "video/quicktime",
        "video/x-msvideo",
    ];
    // Danh sách phần mở rộng được phép (không bao gồm dấu chấm)
    var allowedExtensions = [
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
    var extname = path_1["default"]
        .extname(file.originalname)
        .toLowerCase()
        .replace(/^\./, "");
    // Logging để debug
    console.log("File upload attempt: mimetype=" + file.mimetype + ", extname=" + extname + ", filename=" + file.originalname);
    // Kiểm tra mimetype và extname
    if (allowedMimeTypes.includes(file.mimetype) &&
        allowedExtensions.includes(extname)) {
        return cb(null, true);
    }
    else {
        var errorMessage = "Invalid file type: mimetype=" + file.mimetype + ", extname=." + extname + ". Allowed mimetypes: " + allowedMimeTypes.join(", ");
        console.error(errorMessage);
        cb(new Error(errorMessage));
    }
};
//Tạo instance của multer
var upload = multer_1["default"]({
    storage: multer_1["default"].memoryStorage(),
    fileFilter: fileFilter,
    limits: { fileSize: 100 * 1024 * 1024 }
});
exports["default"] = upload;

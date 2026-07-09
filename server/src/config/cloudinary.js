const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");
require("dotenv").config();

const MAX_UPLOAD_BYTES = Number(process.env.UPLOAD_MAX_BYTES || 3 * 1024 * 1024);
const ALLOWED_IMAGE_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

// Kết nối với tài khoản Cloudinary của bạn
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_KEY,
    api_secret: process.env.CLOUDINARY_SECRET,
});

// Cấu hình kho lưu trữ
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: "dpwood_blogs", // Tên thư mục sẽ tạo trên Cloudinary để chứa ảnh
        allowedFormats: ["jpg", "png", "jpeg", "webp"],
    },
});

const uploadCloud = multer({
    storage,
    limits: {
        fileSize: MAX_UPLOAD_BYTES,
        files: 1,
    },
    fileFilter: (req, file, cb) => {
        if (!ALLOWED_IMAGE_MIME_TYPES.has(file.mimetype)) {
            return cb(new Error("INVALID_IMAGE_TYPE"));
        }
        return cb(null, true);
    },
});

module.exports = uploadCloud;

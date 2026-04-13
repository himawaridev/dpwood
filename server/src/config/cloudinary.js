const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");
require("dotenv").config();

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
        allowedFormats: ["jpg", "png", "jpeg", "webp", "gif"],
    },
});

const uploadCloud = multer({ storage });

module.exports = uploadCloud;

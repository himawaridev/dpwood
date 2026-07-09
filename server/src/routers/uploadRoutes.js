const express = require("express");
const router = express.Router();

const uploadCloud = require("../config/cloudinary");
const authMiddleware = require("../middlewares/authMiddleware");

// ==========================================
// [CLIENT & ADMIN] ROUTES - Tải file
// ==========================================
router.post("/", authMiddleware, uploadCloud.single("image"), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "Không tìm thấy file tải lên" });
        }
        res.status(200).json({ url: req.file.path });
    } catch (error) {
        console.error("Lỗi upload ảnh:", error);
        res.status(500).json({ message: "Lỗi server khi upload ảnh" });
    }
});

router.use((error, req, res, next) => {
    if (!error) return next();

    if (error.code === "LIMIT_FILE_SIZE") {
        return res.status(413).json({ message: "Ảnh tải lên vượt quá dung lượng cho phép" });
    }

    if (error.message === "INVALID_IMAGE_TYPE") {
        return res.status(400).json({ message: "Chỉ hỗ trợ ảnh JPG, PNG hoặc WEBP" });
    }

    console.error("Lỗi upload ảnh:", error.message);
    return res.status(500).json({ message: "Lỗi server khi upload ảnh" });
});

module.exports = router;

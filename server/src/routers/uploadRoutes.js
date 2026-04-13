const express = require("express");
const router = express.Router();
const uploadCloud = require("../config/cloudinary");
const authMiddleware = require("../middlewares/authMiddleware");

// Route nhận file ảnh, biến "image" phải khớp với formData.append("image", file) ở Frontend
router.post("/", authMiddleware, uploadCloud.single("image"), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "Không tìm thấy file tải lên" });
        }

        // Trả về một object chứa URL ảnh vừa lưu trên Cloudinary
        res.status(200).json({ url: req.file.path });
    } catch (error) {
        console.error("Lỗi upload ảnh:", error);
        res.status(500).json({ message: "Lỗi server khi upload ảnh" });
    }
});

module.exports = router;

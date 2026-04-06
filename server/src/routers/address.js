const express = require("express");
const router = express.Router();
const addressController = require("../controllers/addressController");
const authMiddleware = require("../middlewares/authMiddleware");

// Bắt buộc đăng nhập mới được xem/thêm địa chỉ
router.get("/", authMiddleware, addressController.getAddresses);
router.post("/", authMiddleware, addressController.createAddress);

module.exports = router;

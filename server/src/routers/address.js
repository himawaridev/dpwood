const express = require("express");
const router = express.Router();

const addressController = require("../controllers/addressController");
const authMiddleware = require("../middlewares/authMiddleware");

// ==========================================
// [CLIENT] ROUTES - Yêu cầu đăng nhập
// ==========================================
router.get("/", authMiddleware, addressController.getAddresses);
router.post("/", authMiddleware, addressController.createAddress);
router.delete("/:id", authMiddleware, addressController.deleteAddress);

module.exports = router;

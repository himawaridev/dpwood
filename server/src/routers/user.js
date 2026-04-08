const express = require("express");
const router = express.Router();

// Gom tất cả các hàm từ userController vào 1 lần require duy nhất
const {
    getAllUsers,
    updateRole,
    deleteUser,
    toggleBanUser,
    getSystemLogs,
    getMe,
    updateMe,
} = require("../controllers/userController");

const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");

// 1. Route cho cá nhân (Đặt trên cùng)
router.get("/me", authMiddleware, getMe);
router.put("/me", authMiddleware, updateMe);
// Cho phép user xem log của chính mình (me=true)
router.get("/logs", authMiddleware, getSystemLogs);

// 2. Route cho Admin
router.get("/", authMiddleware, roleMiddleware("root", "admin"), getAllUsers);
router.put("/:id/role", authMiddleware, roleMiddleware("root", "admin"), updateRole);
router.delete("/:id", authMiddleware, roleMiddleware("root", "admin"), deleteUser);
router.put("/:id/ban", authMiddleware, roleMiddleware("root", "admin"), toggleBanUser);
// router.get("/logs", authMiddleware, roleMiddleware("root", "admin"), getSystemLogs);

module.exports = router;

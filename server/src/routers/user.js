const express = require("express");
const router = express.Router();

const {
    getAllUsers,
    updateRole,
    deleteUser,
    toggleBanUser,
    getSystemLogs,
    getMe,
    updateMe,
    restoreUser,
} = require("../controllers/userController");
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");

// ==========================================
// [CLIENT] ROUTES - Cài đặt cá nhân
// ==========================================
router.get("/me", authMiddleware, getMe);
router.put("/me", authMiddleware, updateMe);
router.get("/logs", authMiddleware, getSystemLogs); // Cho phép user xem log của chính mình

// ==========================================
// [ADMIN] ROUTES - Quản lý thành viên
// ==========================================
router.get("/", authMiddleware, roleMiddleware("root", "admin"), getAllUsers);
router.put("/:id/role", authMiddleware, roleMiddleware("root", "admin"), updateRole);
router.delete("/:id", authMiddleware, roleMiddleware("root", "admin"), deleteUser);
router.put("/:id/ban", authMiddleware, roleMiddleware("root", "admin"), toggleBanUser);
router.put("/:id/restore", authMiddleware, roleMiddleware("root", "admin"), restoreUser);

module.exports = router;

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
    updateUserPhone,
    restoreUser,
} = require("../controllers/userController");
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");
const { ADMIN_ROLES } = require("../config/accessControl");

// ==========================================
// [CLIENT] ROUTES - Cài đặt cá nhân
// ==========================================
router.get("/me", authMiddleware, getMe);
router.put("/me", authMiddleware, updateMe);
router.get("/logs", authMiddleware, getSystemLogs); // Cho phép user xem log của chính mình

// ==========================================
// [ADMIN] ROUTES - Quản lý thành viên
// ==========================================
router.get("/", authMiddleware, roleMiddleware(ADMIN_ROLES), getAllUsers);
router.put("/:id/role", authMiddleware, roleMiddleware(ADMIN_ROLES), updateRole);
router.put("/:id/phone", authMiddleware, roleMiddleware(ADMIN_ROLES), updateUserPhone);
router.delete("/:id", authMiddleware, roleMiddleware(ADMIN_ROLES), deleteUser);
router.put("/:id/ban", authMiddleware, roleMiddleware(ADMIN_ROLES), toggleBanUser);
router.put("/:id/restore", authMiddleware, roleMiddleware(ADMIN_ROLES), restoreUser);

module.exports = router;

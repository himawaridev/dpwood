const express = require("express");
const router = express.Router();
const {
    getAllUsers,
    updateRole,
    deleteUser,
    toggleBanUser,
    getSystemLogs,
} = require("../controllers/userController");
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");

// Chỉ Admin hoặc Root mới được xem và sửa
router.get("/", authMiddleware, roleMiddleware("root", "admin"), getAllUsers);
router.put("/:id/role", authMiddleware, roleMiddleware("root", "admin"), updateRole);
router.delete("/:id", authMiddleware, roleMiddleware("root", "admin"), deleteUser);
router.put("/:id/ban", authMiddleware, roleMiddleware("root", "admin"), toggleBanUser);
router.get("/logs", authMiddleware, roleMiddleware("root", "admin"), getSystemLogs);

module.exports = router;

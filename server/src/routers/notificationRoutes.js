const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notificationController");
const authMiddleware = require("../middlewares/authMiddleware");

// 🔴 SỬA TẠI ĐÂY: Import đúng file roleMiddleware của bạn
const roleMiddleware = require("../middlewares/roleMiddleware");

// Public API cho trang chủ
router.get("/active", notificationController.getActiveNotifications);

// Admin API
// 🔴 SỬA TẠI ĐÂY: Dùng roleMiddleware("admin", "root") thay vì checkRole(["admin", "root"])
router.get(
    "/",
    authMiddleware,
    roleMiddleware("admin", "root"),
    notificationController.getAllNotifications,
);
router.post(
    "/",
    authMiddleware,
    roleMiddleware("admin", "root"),
    notificationController.createNotification,
);
router.put(
    "/:id",
    authMiddleware,
    roleMiddleware("admin", "root"),
    notificationController.updateNotification,
);
router.delete(
    "/:id",
    authMiddleware,
    roleMiddleware("admin", "root"),
    notificationController.deleteNotification,
);

module.exports = router;

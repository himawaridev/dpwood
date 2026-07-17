const express = require("express");
const router = express.Router();

const notificationController = require("../controllers/notificationController");
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");

// ==========================================
// [PUBLIC] ROUTES
// ==========================================
router.get("/active", notificationController.getActiveNotifications);

// ==========================================
// [ADMIN] ROUTES - Quản trị thông báo
// ==========================================
router.get(
    "/",
    authMiddleware,
    roleMiddleware("admin", "root", "staff"),
    notificationController.getAllNotifications,
);
router.post(
    "/",
    authMiddleware,
    roleMiddleware("admin", "root", "staff"),
    notificationController.createNotification,
);
router.put(
    "/:id",
    authMiddleware,
    roleMiddleware("admin", "root", "staff"),
    notificationController.updateNotification,
);
router.delete(
    "/all",
    authMiddleware,
    roleMiddleware("admin", "root"),
    notificationController.deleteAllNotifications,
);
router.delete(
    "/:id",
    authMiddleware,
    roleMiddleware("admin", "root", "staff"),
    notificationController.deleteNotification,
);

module.exports = router;

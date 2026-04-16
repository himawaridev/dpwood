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

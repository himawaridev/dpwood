const express = require("express");
const router = express.Router();

const notificationController = require("../controllers/notificationController");
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");
const { ADMIN_ROLES, MANAGER_ROLES } = require("../config/accessControl");

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
    roleMiddleware(MANAGER_ROLES),
    notificationController.getAllNotifications,
);
router.post(
    "/",
    authMiddleware,
    roleMiddleware(MANAGER_ROLES),
    notificationController.createNotification,
);
router.put(
    "/:id",
    authMiddleware,
    roleMiddleware(MANAGER_ROLES),
    notificationController.updateNotification,
);
router.delete(
    "/all",
    authMiddleware,
    roleMiddleware(ADMIN_ROLES),
    notificationController.deleteAllNotifications,
);
router.delete(
    "/:id",
    authMiddleware,
    roleMiddleware(MANAGER_ROLES),
    notificationController.deleteNotification,
);

module.exports = router;

const express = require("express");
const controller = require("../controllers/analyticsController");
const optionalAuthMiddleware = require("../middlewares/optionalAuthMiddleware");
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");
const { ADMIN_ROLES, MANAGER_ROLES } = require("../config/accessControl");

const router = express.Router();
router.post("/events", optionalAuthMiddleware, controller.trackEvent);
router.get(
    "/dashboard",
    authMiddleware,
    roleMiddleware(MANAGER_ROLES),
    controller.getCommerceDashboard,
);
router.get(
    "/metrics",
    authMiddleware,
    roleMiddleware(ADMIN_ROLES),
    controller.getOperationalMetrics,
);

module.exports = router;

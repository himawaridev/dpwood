const express = require("express");
const router = express.Router();

const supportController = require("../controllers/supportController");
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");
const { MANAGER_ROLES } = require("../config/accessControl");

// ==========================================
// [CLIENT] ROUTES - Yêu cầu hỗ trợ của khách
// ==========================================
router.post("/", authMiddleware, supportController.createTicket);
router.get("/my-tickets", authMiddleware, supportController.getMyTickets);

// ==========================================
// [ADMIN] ROUTES - Xử lý yêu cầu hỗ trợ
// ==========================================
router.get(
    "/admin/all",
    authMiddleware,
    roleMiddleware(MANAGER_ROLES),
    supportController.getAllTickets,
);
router.put(
    "/admin/:id/status",
    authMiddleware,
    roleMiddleware(MANAGER_ROLES),
    supportController.updateStatus,
);
router.put(
    "/admin/:id/resolution",
    authMiddleware,
    roleMiddleware(MANAGER_ROLES),
    supportController.updateResolution,
);

module.exports = router;

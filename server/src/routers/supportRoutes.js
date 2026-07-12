const express = require("express");
const router = express.Router();

const supportController = require("../controllers/supportController");
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");

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
    roleMiddleware("admin", "root", "staff"),
    supportController.getAllTickets,
);
router.put(
    "/admin/:id/status",
    authMiddleware,
    roleMiddleware("admin", "root", "staff"),
    supportController.updateStatus,
);
router.put(
    "/admin/:id/resolution",
    authMiddleware,
    roleMiddleware("admin", "root", "staff"),
    supportController.updateResolution,
);

module.exports = router;

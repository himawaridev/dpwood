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
router.get("/:id/messages", authMiddleware, supportController.getTicketMessages);
router.post("/:id/reply", authMiddleware, supportController.replyTicket);

// ==========================================
// [ADMIN] ROUTES - Xử lý yêu cầu hỗ trợ
// ==========================================
router.get(
    "/admin/all",
    authMiddleware,
    roleMiddleware("admin", "root"),
    supportController.getAllTickets,
);
router.put(
    "/admin/:id/status",
    authMiddleware,
    roleMiddleware("admin", "root"),
    supportController.updateStatus,
);

module.exports = router;

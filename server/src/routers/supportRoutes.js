const express = require("express");
const router = express.Router();
const supportController = require("../controllers/supportController");
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware"); // Dùng roleMiddleware của bạn

// Client API
router.post("/", authMiddleware, supportController.createTicket);
router.get("/my-tickets", authMiddleware, supportController.getMyTickets);
router.get("/:id/messages", authMiddleware, supportController.getTicketMessages);
router.post("/:id/reply", authMiddleware, supportController.replyTicket);

// Admin API
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

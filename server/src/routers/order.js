const express = require("express");
const router = express.Router();

const orderController = require("../controllers/orderController");
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");

// ==========================================
// [PUBLIC] ROUTES - Khách vãng lai & Hệ thống thứ 3
// ==========================================
router.post("/webhook", orderController.handleWebhook);
router.get("/:orderCode/status", orderController.getOrderStatus);

// ==========================================
// [CLIENT] ROUTES - Khách hàng
// ==========================================
router.get("/me", authMiddleware, orderController.getMyOrders);
router.post("/checkout", authMiddleware, orderController.checkout);
router.put("/:orderCode/cancel", authMiddleware, orderController.cancelOrder);

// ==========================================
// [ADMIN] ROUTES - Quản lý đơn hàng
// ==========================================
router.get(
    "/admin",
    authMiddleware,
    roleMiddleware("root", "admin"),
    orderController.getAllOrdersAdmin,
);
router.put(
    "/admin/:id/status",
    authMiddleware,
    roleMiddleware("root", "admin"),
    orderController.updateOrderStatusAdmin,
);

module.exports = router;

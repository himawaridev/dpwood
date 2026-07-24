const express = require("express");
const router = express.Router();

const orderController = require("../controllers/orderController");
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");
const { orderStatusLimiter, paymentLimiter } = require("../middlewares/securityMiddleware");
const { MANAGER_ROLES } = require("../config/accessControl");

// ==========================================
// [PUBLIC] ROUTES - Khách vãng lai & Hệ thống thứ 3
// ==========================================
router.post("/webhook", paymentLimiter, orderController.handleWebhook);
router.get("/:orderCode/status", orderStatusLimiter, authMiddleware, orderController.getOrderStatus);
router.get("/:orderCode/payment-link", paymentLimiter, authMiddleware, orderController.getPaymentLink);

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
    roleMiddleware(MANAGER_ROLES),
    orderController.getAllOrdersAdmin,
);
router.put(
    "/admin/:id/status",
    authMiddleware,
    roleMiddleware(MANAGER_ROLES),
    orderController.updateOrderStatusAdmin,
);

module.exports = router;

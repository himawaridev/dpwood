const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");

// Route Webhook Public cho bên thứ 3 (Cổng thanh toán PayOS) gọi vào
router.post("/webhook", orderController.handleWebhook);

// Route của Khách hàng (Bắt buộc đăng nhập)
router.get("/me", authMiddleware, orderController.getMyOrders);
router.post("/checkout", authMiddleware, orderController.checkout);

// Route Public để kiểm tra trạng thái khi đang quét QR
router.get("/:orderCode/status", orderController.getOrderStatus);
router.put("/:orderCode/cancel", authMiddleware, orderController.cancelOrder);

// Route của Admin (Bắt buộc có quyền root hoặc admin)
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

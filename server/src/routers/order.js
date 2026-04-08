const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");

// Route thanh toán bắt buộc phải đăng nhập
router.post("/checkout", authMiddleware, orderController.checkout);

// 🔴 ĐƯA ROUTE NÀY LÊN TRÊN CÙNG
router.get("/me", authMiddleware, orderController.getMyOrders);

// Các route có params (như :orderCode, :id) phải đặt ở dưới
router.get("/:orderCode/status", authMiddleware, orderController.getOrderStatus);
router.put("/:orderCode/cancel", authMiddleware, orderController.cancelOrder);

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

// Route Webhook Public cho bên thứ 3 (Cổng thanh toán) gọi vào
router.post("/webhook", orderController.handleWebhook);

module.exports = router;

const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");
const authMiddleware = require("../middlewares/authMiddleware");

// Route thanh toán bắt buộc phải đăng nhập
router.post("/checkout", authMiddleware, orderController.checkout);

// Route Webhook Public cho bên thứ 3 (Cổng thanh toán) gọi vào
router.post("/webhook", orderController.handleWebhook);
router.get("/:orderCode/status", authMiddleware, orderController.getOrderStatus);
router.put("/:orderCode/cancel", authMiddleware, orderController.cancelOrder);

module.exports = router;

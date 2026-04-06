const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");
const authMiddleware = require("../middlewares/authMiddleware");

// Giả sử bạn đã có middleware kiểm tra quyền từ các bài trước
// Nếu file của bạn tên khác, hãy đổi lại đường dẫn cho đúng nhé
const roleMiddleware = require("../middlewares/roleMiddleware");

// [GET] Public - Ai cũng có thể xem danh sách sản phẩm để mua sắm
router.get("/", productController.getAllProducts);

// [POST] Private - Chỉ admin và root được thêm sản phẩm
router.post("/", authMiddleware, roleMiddleware("root", "admin"), productController.createProduct);

// [PUT] Private - Chỉ admin và root được sửa sản phẩm
router.put(
    "/:id",
    authMiddleware,
    roleMiddleware("root", "admin"),
    productController.updateProduct,
);

// [DELETE] Private - Chỉ admin và root được xóa sản phẩm
router.delete(
    "/:id",
    authMiddleware,
    roleMiddleware("root", "admin"),
    productController.deleteProduct,
);

module.exports = router;

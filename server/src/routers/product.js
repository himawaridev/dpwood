const express = require("express");
const router = express.Router();

const productController = require("../controllers/productController");
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");

// ==========================================
// [PUBLIC] ROUTES - Xem sản phẩm
// ==========================================
router.get("/", productController.getAllProducts);
router.get("/:id", productController.getProductById);

// ==========================================
// [ADMIN] ROUTES - Quản lý sản phẩm
// ==========================================
router.post("/", authMiddleware, roleMiddleware("root", "admin"), productController.createProduct);
router.put(
    "/:id",
    authMiddleware,
    roleMiddleware("root", "admin"),
    productController.updateProduct,
);
router.delete(
    "/:id",
    authMiddleware,
    roleMiddleware("root", "admin"),
    productController.deleteProduct,
);

module.exports = router;

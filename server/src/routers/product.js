const express = require("express");
const router = express.Router();

const productController = require("../controllers/productController");
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");

// ==========================================
// [PUBLIC] ROUTES - Xem sản phẩm
// ==========================================
router.get("/categories", productController.getProductCategories);
router.get("/", productController.getAllProducts);
router.get("/wishlist/me", authMiddleware, productController.getMyWishlist);
router.post("/:id/wishlist", authMiddleware, productController.toggleWishlist);
router.get("/:id/related", productController.getRelatedProducts);
router.get("/:id", productController.getProductById);
router.get("/:id/rating", authMiddleware, productController.getMyProductRating);
router.post("/:id/rating", authMiddleware, productController.rateProduct);

// ==========================================
// [ADMIN] ROUTES - Quản lý sản phẩm
// ==========================================
router.post(
    "/categories",
    authMiddleware,
    roleMiddleware("root", "admin"),
    productController.createProductCategory,
);
router.put(
    "/categories/:id",
    authMiddleware,
    roleMiddleware("root", "admin"),
    productController.updateProductCategory,
);
router.delete(
    "/categories/:id",
    authMiddleware,
    roleMiddleware("root", "admin"),
    productController.deleteProductCategory,
);
router.post("/", authMiddleware, roleMiddleware("root", "admin"), productController.createProduct);
router.put(
    "/:id",
    authMiddleware,
    roleMiddleware("root", "admin"),
    productController.updateProduct,
);
router.delete(
    "/all",
    authMiddleware,
    roleMiddleware("root", "admin"),
    productController.deleteAllProducts,
);
router.delete(
    "/:id",
    authMiddleware,
    roleMiddleware("root", "admin"),
    productController.deleteProduct,
);

module.exports = router;

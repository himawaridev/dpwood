const express = require("express");
const router = express.Router();

const productController = require("../controllers/productController");
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");
const { ADMIN_ROLES } = require("../config/accessControl");

// ==========================================
// [PUBLIC] ROUTES - Xem sản phẩm
// ==========================================
router.get("/categories", productController.getProductCategories);
router.get("/", productController.getAllProducts);
router.get("/wishlist/me", authMiddleware, productController.getMyWishlist);
router.get(
    "/admin/ratings",
    authMiddleware,
    roleMiddleware(ADMIN_ROLES),
    productController.getAdminProductRatings,
);
router.post(
    "/admin/ratings",
    authMiddleware,
    roleMiddleware(ADMIN_ROLES),
    productController.createAdminProductRating,
);
router.put(
    "/admin/ratings/:ratingId",
    authMiddleware,
    roleMiddleware(ADMIN_ROLES),
    productController.updateAdminProductRating,
);
router.delete(
    "/admin/ratings/:ratingId",
    authMiddleware,
    roleMiddleware(ADMIN_ROLES),
    productController.deleteAdminProductRating,
);
router.post("/:id/wishlist", authMiddleware, productController.toggleWishlist);
router.get("/:id/related", productController.getRelatedProducts);
router.get("/:id/reviews", productController.getProductReviews);
router.get("/:id", productController.getProductById);
router.get("/:id/rating", authMiddleware, productController.getMyProductRating);
router.post("/:id/rating", authMiddleware, productController.rateProduct);

// ==========================================
// [ADMIN] ROUTES - Quản lý sản phẩm
// ==========================================
router.post(
    "/categories",
    authMiddleware,
    roleMiddleware(ADMIN_ROLES),
    productController.createProductCategory,
);
router.put(
    "/categories/:id",
    authMiddleware,
    roleMiddleware(ADMIN_ROLES),
    productController.updateProductCategory,
);
router.delete(
    "/categories/:id",
    authMiddleware,
    roleMiddleware(ADMIN_ROLES),
    productController.deleteProductCategory,
);
router.post("/", authMiddleware, roleMiddleware(ADMIN_ROLES), productController.createProduct);
router.put(
    "/:id",
    authMiddleware,
    roleMiddleware(ADMIN_ROLES),
    productController.updateProduct,
);
router.delete(
    "/all",
    authMiddleware,
    roleMiddleware(ADMIN_ROLES),
    productController.deleteAllProducts,
);
router.delete(
    "/:id",
    authMiddleware,
    roleMiddleware(ADMIN_ROLES),
    productController.deleteProduct,
);

module.exports = router;

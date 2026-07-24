const express = require("express");
const router = express.Router();

const couponController = require("../controllers/couponController");
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");
const { ADMIN_ROLES } = require("../config/accessControl");

// ==========================================
// [PUBLIC] ROUTES
// ==========================================
router.get("/active", couponController.getActiveCoupons);

// ==========================================
// [USER] ROUTES - Người dùng đã đăng nhập
// ==========================================
router.post("/claim", authMiddleware, couponController.claimCoupon);
router.get("/my", authMiddleware, couponController.getMyCoupons);
router.delete("/my/:id", authMiddleware, couponController.deleteMyCoupon);
router.post("/apply", authMiddleware, couponController.applyCoupon);

// ==========================================
// [ADMIN] ROUTES - Quản lý mã giảm giá
// ==========================================
router.get(
    "/admin",
    authMiddleware,
    roleMiddleware(ADMIN_ROLES),
    couponController.getAllCoupons,
);
router.post(
    "/admin",
    authMiddleware,
    roleMiddleware(ADMIN_ROLES),
    couponController.createCoupon,
);
router.put(
    "/admin/:id",
    authMiddleware,
    roleMiddleware(ADMIN_ROLES),
    couponController.updateCoupon,
);
router.delete(
    "/admin/all",
    authMiddleware,
    roleMiddleware(ADMIN_ROLES),
    couponController.deleteAllCoupons,
);
router.delete(
    "/admin/:id",
    authMiddleware,
    roleMiddleware(ADMIN_ROLES),
    couponController.deleteCoupon,
);

module.exports = router;

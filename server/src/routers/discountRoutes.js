const express = require("express");
const router = express.Router();
const discountController = require("../controllers/discountController");
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");
const { ADMIN_ROLES } = require("../config/accessControl");

// Public
router.get("/active", discountController.getActiveDiscounts);
router.post("/validate", discountController.validateDiscount);

// Admin
router.get(
    "/",
    authMiddleware,
    roleMiddleware(ADMIN_ROLES),
    discountController.getAllDiscounts,
);
router.post(
    "/",
    authMiddleware,
    roleMiddleware(ADMIN_ROLES),
    discountController.createDiscount,
);
router.delete(
    "/:id",
    authMiddleware,
    roleMiddleware(ADMIN_ROLES),
    discountController.deleteDiscount,
);

module.exports = router;

const express = require("express");
const router = express.Router();
const discountController = require("../controllers/discountController");
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");

// Public
router.get("/active", discountController.getActiveDiscounts);
router.post("/validate", discountController.validateDiscount);

// Admin
router.get(
    "/",
    authMiddleware,
    roleMiddleware("admin", "root"),
    discountController.getAllDiscounts,
);
router.post(
    "/",
    authMiddleware,
    roleMiddleware("admin", "root"),
    discountController.createDiscount,
);
router.delete(
    "/:id",
    authMiddleware,
    roleMiddleware("admin", "root"),
    discountController.deleteDiscount,
);

module.exports = router;

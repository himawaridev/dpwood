const express = require("express");
const controller = require("../controllers/commerceController");
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");
const { MANAGER_ROLES } = require("../config/accessControl");

const router = express.Router();
const manager = [authMiddleware, roleMiddleware(MANAGER_ROLES)];

router.get("/shipping/quote", controller.getShippingQuote);
router.post("/shipping/quote", controller.getShippingQuote);
router.get("/orders/:orderId/shipment", authMiddleware, controller.getShipment);
router.put("/orders/:orderId/shipment", ...manager, controller.upsertShipment);
router.post("/returns", authMiddleware, controller.createReturnRequest);
router.get("/returns/me", authMiddleware, controller.listMyReturns);
router.get("/returns", ...manager, controller.listReturnsAdmin);
router.put("/returns/:id", ...manager, controller.updateReturnRequest);
router.get("/inventory", ...manager, controller.listInventoryMovements);
router.get("/cart", authMiddleware, controller.getSavedCart);
router.put("/cart", authMiddleware, controller.saveCart);
router.delete("/cart", authMiddleware, controller.clearSavedCart);

module.exports = router;

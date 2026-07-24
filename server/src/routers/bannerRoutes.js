const express = require("express");
const bannerController = require("../controllers/bannerController");
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");
const { ADMIN_ROLES } = require("../config/accessControl");

const router = express.Router();

router.get("/active", bannerController.getActiveBanners);
router.get("/", authMiddleware, roleMiddleware(ADMIN_ROLES), bannerController.getAllBanners);
router.post("/", authMiddleware, roleMiddleware(ADMIN_ROLES), bannerController.createBanner);
router.put("/:id", authMiddleware, roleMiddleware(ADMIN_ROLES), bannerController.updateBanner);
router.delete("/:id", authMiddleware, roleMiddleware(ADMIN_ROLES), bannerController.deleteBanner);

module.exports = router;

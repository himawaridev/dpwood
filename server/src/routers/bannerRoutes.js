const express = require("express");
const bannerController = require("../controllers/bannerController");
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");

const router = express.Router();

router.get("/active", bannerController.getActiveBanners);
router.get("/", authMiddleware, roleMiddleware("admin", "root"), bannerController.getAllBanners);
router.post("/", authMiddleware, roleMiddleware("admin", "root"), bannerController.createBanner);
router.put("/:id", authMiddleware, roleMiddleware("admin", "root"), bannerController.updateBanner);
router.delete("/:id", authMiddleware, roleMiddleware("admin", "root"), bannerController.deleteBanner);

module.exports = router;

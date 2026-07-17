const express = require("express");
const newsletterController = require("../controllers/newsletterController");
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");
const { newsletterLimiter } = require("../middlewares/securityMiddleware");

const router = express.Router();
const adminOnly = [authMiddleware, roleMiddleware("admin", "root")];

router.post("/subscribe", newsletterLimiter, newsletterController.subscribe);
router.post("/confirm/:token", newsletterLimiter, newsletterController.confirmSubscription);
router.post("/unsubscribe/:token", newsletterLimiter, newsletterController.unsubscribe);
router.get("/admin/recipients", ...adminOnly, newsletterController.getVerifiedRecipients);
router.get("/admin/subscribers", ...adminOnly, newsletterController.getSubscribers);
router.get("/admin/campaigns", ...adminOnly, newsletterController.getCampaigns);
router.post("/admin/send", ...adminOnly, newsletterController.sendCampaign);
router.post("/admin/campaigns/:id/cancel", ...adminOnly, newsletterController.cancelCampaign);
router.post("/admin/send-welcome", ...adminOnly, newsletterController.sendPendingWelcomeEmails);

module.exports = router;

const express = require("express");
const newsletterController = require("../controllers/newsletterController");
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");
const { newsletterLimiter } = require("../middlewares/securityMiddleware");
const { ADMIN_ROLES } = require("../config/accessControl");

const router = express.Router();
const adminOnly = [authMiddleware, roleMiddleware(ADMIN_ROLES)];

router.post("/subscribe", newsletterLimiter, newsletterController.subscribe);
router.post("/confirm/:token", newsletterLimiter, newsletterController.confirmSubscription);
router.post("/unsubscribe/:token", newsletterLimiter, newsletterController.unsubscribe);
router.get("/admin/recipients", ...adminOnly, newsletterController.getVerifiedRecipients);
router.get("/admin/subscribers", ...adminOnly, newsletterController.getSubscribers);
router.post(
    "/admin/subscribers/:id/resend-verification",
    ...adminOnly,
    newsletterController.resendSubscriberVerification,
);
router.delete("/admin/subscribers/:id", ...adminOnly, newsletterController.deleteSubscriber);
router.get("/admin/campaigns", ...adminOnly, newsletterController.getCampaigns);
router.get("/admin/email-status", ...adminOnly, newsletterController.getEmailProviderStatus);
router.post("/admin/preview", ...adminOnly, newsletterController.previewCampaign);
router.post("/admin/test-email", ...adminOnly, newsletterController.sendTestEmail);
router.post("/admin/send", ...adminOnly, newsletterController.sendCampaign);
router.post("/admin/campaigns/:id/cancel", ...adminOnly, newsletterController.cancelCampaign);
router.post("/admin/campaigns/:id/resend", ...adminOnly, newsletterController.resendCampaign);
router.delete("/admin/campaigns/:id", ...adminOnly, newsletterController.deleteCampaign);
router.post("/admin/send-welcome", ...adminOnly, newsletterController.sendPendingWelcomeEmails);

module.exports = router;

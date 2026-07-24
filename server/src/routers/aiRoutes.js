const express = require("express");
const router = express.Router();

const aiController = require("../controllers/aiController");
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");
const { imageProxyLimiter, supportChatLimiter } = require("../middlewares/securityMiddleware");
const { ADMIN_ROLES } = require("../config/accessControl");

router.get("/image-proxy", imageProxyLimiter, aiController.proxyImage);
router.get("/product-image-placeholder", aiController.productImagePlaceholder);
router.get("/sample-product-image", aiController.sampleProductImage);
router.get("/product-json-sample", authMiddleware, roleMiddleware(ADMIN_ROLES), aiController.downloadProductJsonSample);
router.post("/blog-draft", authMiddleware, roleMiddleware(ADMIN_ROLES), aiController.createBlogDraft);
router.post("/blog-batch", authMiddleware, roleMiddleware(ADMIN_ROLES), aiController.createBlogBatch);
router.post("/product-draft", authMiddleware, roleMiddleware(ADMIN_ROLES), aiController.createProductDraft);
router.post("/product-batch", authMiddleware, roleMiddleware(ADMIN_ROLES), aiController.createProductBatch);
router.post("/product-json-import", authMiddleware, roleMiddleware(ADMIN_ROLES), aiController.importProductJsonDrafts);
router.post("/product-batch-save", authMiddleware, roleMiddleware(ADMIN_ROLES), aiController.saveProductBatchDrafts);
router.post("/email-draft", authMiddleware, roleMiddleware(ADMIN_ROLES), aiController.createEmailDraft);
router.post(
    "/support-auto-resolve",
    authMiddleware,
    roleMiddleware(ADMIN_ROLES),
    aiController.autoResolveSupportTickets,
);
router.post("/support-chat", supportChatLimiter, aiController.createSupportChatReply);
router.post("/product-advisor", supportChatLimiter, aiController.createProductAdvisorReply);

module.exports = router;

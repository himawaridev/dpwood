const express = require("express");
const router = express.Router();

const aiController = require("../controllers/aiController");
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");
const { imageProxyLimiter, supportChatLimiter } = require("../middlewares/securityMiddleware");

router.get("/image-proxy", imageProxyLimiter, aiController.proxyImage);
router.get("/product-image-placeholder", aiController.productImagePlaceholder);
router.get("/sample-product-image", aiController.sampleProductImage);
router.get("/product-json-sample", authMiddleware, roleMiddleware("admin", "root"), aiController.downloadProductJsonSample);
router.post("/blog-draft", authMiddleware, roleMiddleware("admin", "root"), aiController.createBlogDraft);
router.post("/blog-batch", authMiddleware, roleMiddleware("admin", "root"), aiController.createBlogBatch);
router.post("/product-draft", authMiddleware, roleMiddleware("admin", "root"), aiController.createProductDraft);
router.post("/product-batch", authMiddleware, roleMiddleware("admin", "root"), aiController.createProductBatch);
router.post("/product-json-import", authMiddleware, roleMiddleware("admin", "root"), aiController.importProductJsonDrafts);
router.post("/product-batch-save", authMiddleware, roleMiddleware("admin", "root"), aiController.saveProductBatchDrafts);
router.post(
    "/support-auto-resolve",
    authMiddleware,
    roleMiddleware("admin", "root"),
    aiController.autoResolveSupportTickets,
);
router.post("/support-chat", supportChatLimiter, aiController.createSupportChatReply);
router.post("/product-advisor", supportChatLimiter, aiController.createProductAdvisorReply);

module.exports = router;

const express = require("express");
const router = express.Router();

const aiController = require("../controllers/aiController");
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");

router.get("/image-proxy", aiController.proxyImage);
router.get("/product-image-placeholder", aiController.productImagePlaceholder);
router.post("/blog-draft", authMiddleware, roleMiddleware("admin", "root"), aiController.createBlogDraft);
router.post("/blog-batch", authMiddleware, roleMiddleware("admin", "root"), aiController.createBlogBatch);
router.post("/product-draft", authMiddleware, roleMiddleware("admin", "root"), aiController.createProductDraft);
router.post("/product-batch", authMiddleware, roleMiddleware("admin", "root"), aiController.createProductBatch);
router.post("/product-batch-save", authMiddleware, roleMiddleware("admin", "root"), aiController.saveProductBatchDrafts);
router.post(
    "/support-auto-resolve",
    authMiddleware,
    roleMiddleware("admin", "root"),
    aiController.autoResolveSupportTickets,
);
router.post("/support-chat", aiController.createSupportChatReply);

module.exports = router;

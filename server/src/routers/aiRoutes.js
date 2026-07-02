const express = require("express");
const router = express.Router();

const aiController = require("../controllers/aiController");
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");

router.post("/blog-draft", authMiddleware, roleMiddleware("admin", "root"), aiController.createBlogDraft);
router.post("/product-draft", authMiddleware, roleMiddleware("admin", "root"), aiController.createProductDraft);
router.post("/support-chat", aiController.createSupportChatReply);

module.exports = router;

const express = require("express");
const router = express.Router();

const blogController = require("../controllers/blogController");
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");

// ==========================================
// [PUBLIC] ROUTES - Đọc bài viết
// ==========================================
router.get("/", blogController.getAllBlogs);
router.get("/:slug", blogController.getBlogBySlug);

// ==========================================
// [ADMIN] ROUTES - Quản trị bài viết
// ==========================================
router.post("/", authMiddleware, roleMiddleware("admin", "root"), blogController.createBlog);
router.put("/:id", authMiddleware, roleMiddleware("admin", "root"), blogController.updateBlog);
router.delete("/:id", authMiddleware, roleMiddleware("admin", "root"), blogController.deleteBlog);
router.get(
    "/admin-get/:id",
    authMiddleware,
    roleMiddleware("admin", "root"),
    blogController.getBlogById,
);

// ==========================================
// [USER] ROUTES - Bình luận bài viết
// ==========================================
router.post("/:id/comments", authMiddleware, blogController.addComment);

module.exports = router;

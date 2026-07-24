const express = require("express");
const router = express.Router();

const blogController = require("../controllers/blogController");
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");
const { ADMIN_ROLES } = require("../config/accessControl");

// ==========================================
// [PUBLIC] ROUTES - Đọc bài viết
// ==========================================
router.get("/", blogController.getAllBlogs);
router.get("/:slug", blogController.getBlogBySlug);

// ==========================================
// [ADMIN] ROUTES - Quản trị bài viết
// ==========================================
router.post("/", authMiddleware, roleMiddleware(ADMIN_ROLES), blogController.createBlog);
router.put("/:id", authMiddleware, roleMiddleware(ADMIN_ROLES), blogController.updateBlog);
router.delete(
    "/admin/all",
    authMiddleware,
    roleMiddleware(ADMIN_ROLES),
    blogController.deleteAllBlogs,
);
router.delete("/:id", authMiddleware, roleMiddleware(ADMIN_ROLES), blogController.deleteBlog);
router.get(
    "/admin-get/:id",
    authMiddleware,
    roleMiddleware(ADMIN_ROLES),
    blogController.getBlogById,
);

// ==========================================
// [USER] ROUTES - Bình luận bài viết
// ==========================================
router.post("/:id/comments", authMiddleware, blogController.addComment);

module.exports = router;

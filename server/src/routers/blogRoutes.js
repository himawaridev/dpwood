const express = require("express");
const router = express.Router();
const blogController = require("../controllers/blogController");
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");

// Public (Khách hàng)
router.get("/", blogController.getAllBlogs);
router.get("/:slug", blogController.getBlogBySlug);

// Admin (Chỉ Quản trị viên mới được đăng bài)
router.post("/", authMiddleware, roleMiddleware("admin", "root"), blogController.createBlog);
// (Bạn có thể tự làm thêm các route PUT, DELETE sau nhé)
router.put("/:id", authMiddleware, roleMiddleware("admin", "root"), blogController.updateBlog);
router.delete("/:id", authMiddleware, roleMiddleware("admin", "root"), blogController.deleteBlog);
router.get(
    "/admin-get/:id",
    authMiddleware,
    roleMiddleware("admin", "root"),
    blogController.getBlogById,
);
module.exports = router;

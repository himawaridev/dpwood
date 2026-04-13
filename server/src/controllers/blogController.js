const Blog = require("../models/blog");

// Hàm hỗ trợ tạo Slug từ Tiêu đề (VD: "Xin chào" -> "xin-chao")
const generateSlug = (title) => {
    return title
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
};

const blogController = {
    // 1. [ADMIN] Tạo bài viết mới
    createBlog: async (req, res) => {
        try {
            const { title, thumbnail, summary, content, author, isPublished } = req.body;
            let slug = generateSlug(title);

            // Thêm mã ngẫu nhiên để tránh trùng slug nếu bài viết trùng tên
            const existingBlog = await Blog.findOne({ where: { slug } });
            if (existingBlog) slug = `${slug}-${Math.floor(Math.random() * 1000)}`;

            const newBlog = await Blog.create({
                title,
                slug,
                thumbnail,
                summary,
                content,
                author,
                isPublished,
            });
            res.status(201).json(newBlog);
        } catch (error) {
            console.error("Lỗi tạo blog:", error);
            res.status(500).json({ message: "Lỗi khi tạo bài viết" });
        }
    },

    // 2. [CHUNG] Lấy danh sách bài viết (Có phân trang)
    getAllBlogs: async (req, res) => {
        try {
            // Nếu là khách xem, chỉ lấy bài đã xuất bản
            const whereClause = req.query.public === "true" ? { isPublished: true } : {};
            const blogs = await Blog.findAll({
                where: whereClause,
                order: [["createdAt", "DESC"]],
                attributes: [
                    "id",
                    "title",
                    "slug",
                    "thumbnail",
                    "summary",
                    "author",
                    "createdAt",
                    "views",
                    "isPublished",
                ], // Không lấy full content để web load nhanh
            });
            res.status(200).json(blogs);
        } catch (error) {
            res.status(500).json({ message: "Lỗi tải danh sách" });
        }
    },

    // 3. [CHUNG] Xem chi tiết 1 bài viết bằng Slug
    getBlogBySlug: async (req, res) => {
        try {
            const blog = await Blog.findOne({ where: { slug: req.params.slug } });
            if (!blog) return res.status(404).json({ message: "Không tìm thấy bài viết" });

            // Tăng lượt xem lên 1
            await blog.increment("views");

            res.status(200).json(blog);
        } catch (error) {
            res.status(500).json({ message: "Lỗi tải bài viết" });
        }
    },

    updateBlog: async (req, res) => {
        try {
            const {
                title,
                thumbnail,
                summary,
                content,
                author,
                isPublished,
                metaTitle,
                metaDescription,
                metaKeywords,
            } = req.body;
            const blog = await Blog.findByPk(req.params.id);

            if (!blog) return res.status(404).json({ message: "Không tìm thấy bài viết" });

            await blog.update({
                title,
                thumbnail,
                summary,
                content,
                author,
                isPublished,
                metaTitle,
                metaDescription,
                metaKeywords,
            });

            res.status(200).json(blog);
        } catch (error) {
            res.status(500).json({ message: "Lỗi khi cập nhật bài viết" });
        }
    },

    // 🔴 XÓA BÀI VIẾT
    deleteBlog: async (req, res) => {
        try {
            const blog = await Blog.findByPk(req.params.id);
            if (!blog) return res.status(404).json({ message: "Không tìm thấy bài viết" });
            await blog.destroy();
            res.status(200).json({ message: "Đã xóa bài viết" });
        } catch (error) {
            res.status(500).json({ message: "Lỗi khi xóa bài viết" });
        }
    },

    getBlogById: async (req, res) => {
        try {
            const blog = await Blog.findByPk(req.params.id);
            if (!blog) return res.status(404).json({ message: "Không tìm thấy bài viết" });
            res.status(200).json(blog);
        } catch (error) {
            res.status(500).json({ message: "Lỗi máy chủ" });
        }
    },
};

module.exports = blogController;

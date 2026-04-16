const Blog = require("../models/blog");

// ==========================================
// HÀM HỖ TRỢ (HELPERS)
// ==========================================
const generateSlug = (title) => {
    return title
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
};

// ==========================================
// [PUBLIC] ROUTE CHO KHÁCH HÀNG
// ==========================================
const getAllBlogs = async (req, res) => {
    try {
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
            ],
        });
        res.status(200).json(blogs);
    } catch (error) {
        console.error("Lỗi getAllBlogs:", error);
        res.status(500).json({ message: "Lỗi tải danh sách bài viết", error: error.message });
    }
};

const getBlogBySlug = async (req, res) => {
    try {
        const blog = await Blog.findOne({ where: { slug: req.params.slug } });
        if (!blog) return res.status(404).json({ message: "Không tìm thấy bài viết" });

        await blog.increment("views");
        res.status(200).json(blog);
    } catch (error) {
        console.error("Lỗi getBlogBySlug:", error);
        res.status(500).json({ message: "Lỗi tải bài viết", error: error.message });
    }
};

// ==========================================
// [ADMIN] ROUTE QUẢN TRỊ VIÊN
// ==========================================
const createBlog = async (req, res) => {
    try {
        const { title, thumbnail, summary, content, author, isPublished } = req.body;
        let slug = generateSlug(title);

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
        console.error("Lỗi createBlog:", error);
        res.status(500).json({ message: "Lỗi tạo bài viết", error: error.message });
    }
};

const updateBlog = async (req, res) => {
    try {
        const blog = await Blog.findByPk(req.params.id);
        if (!blog) return res.status(404).json({ message: "Không tìm thấy bài viết" });

        await blog.update(req.body);
        res.status(200).json(blog);
    } catch (error) {
        console.error("Lỗi updateBlog:", error);
        res.status(500).json({ message: "Lỗi cập nhật bài viết", error: error.message });
    }
};

const deleteBlog = async (req, res) => {
    try {
        const blog = await Blog.findByPk(req.params.id);
        if (!blog) return res.status(404).json({ message: "Không tìm thấy bài viết" });

        await blog.destroy();
        res.status(200).json({ message: "Đã xóa bài viết" });
    } catch (error) {
        console.error("Lỗi deleteBlog:", error);
        res.status(500).json({ message: "Lỗi xóa bài viết", error: error.message });
    }
};

const getBlogById = async (req, res) => {
    try {
        const blog = await Blog.findByPk(req.params.id);
        if (!blog) return res.status(404).json({ message: "Không tìm thấy bài viết" });
        res.status(200).json(blog);
    } catch (error) {
        console.error("Lỗi getBlogById:", error);
        res.status(500).json({ message: "Lỗi máy chủ", error: error.message });
    }
};

module.exports = { getAllBlogs, getBlogBySlug, createBlog, updateBlog, deleteBlog, getBlogById };

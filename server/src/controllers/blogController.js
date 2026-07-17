const Blog = require("../models/blog");
const { sanitizePlainText, sanitizeRichHtml } = require("../utils/htmlSanitizer");

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

const sanitizeBlogRecord = (blog) => {
    if (!blog) return blog;
    const data = typeof blog.toJSON === "function" ? blog.toJSON() : { ...blog };
    return {
        ...data,
        title: sanitizePlainText(data.title),
        thumbnail: sanitizePlainText(data.thumbnail),
        summary: sanitizePlainText(data.summary),
        content: sanitizeRichHtml(data.content),
        author: sanitizePlainText(data.author),
        metaTitle: sanitizePlainText(data.metaTitle),
        metaDescription: sanitizePlainText(data.metaDescription),
        metaKeywords: sanitizePlainText(data.metaKeywords),
        comments: Array.isArray(data.comments)
            ? data.comments.map((comment) => ({
                  ...comment,
                  userName: sanitizePlainText(comment.userName),
                  text: sanitizePlainText(comment.text),
                  replies: Array.isArray(comment.replies)
                      ? comment.replies.map((reply) => ({
                            ...reply,
                            userName: sanitizePlainText(reply.userName),
                            text: sanitizePlainText(reply.text),
                        }))
                      : [],
              }))
            : [],
    };
};

const buildBlogPayload = (body) => ({
    title: sanitizePlainText(body.title),
    thumbnail: sanitizePlainText(body.thumbnail),
    summary: sanitizePlainText(body.summary),
    content: sanitizeRichHtml(body.content),
    author: sanitizePlainText(body.author || "Admin"),
    isPublished: body.isPublished === undefined ? true : Boolean(body.isPublished),
    metaTitle: sanitizePlainText(body.metaTitle),
    metaDescription: sanitizePlainText(body.metaDescription),
    metaKeywords: sanitizePlainText(body.metaKeywords),
});

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
        res.status(200).json(blogs.map((blog) => sanitizeBlogRecord(blog)));
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
        res.status(200).json(sanitizeBlogRecord(blog));
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
        const payload = buildBlogPayload(req.body);
        const { title } = payload;
        if (!title || !payload.content) {
            return res.status(400).json({ message: "Tiêu đề và nội dung bài viết là bắt buộc" });
        }
        let slug = generateSlug(title);

        const existingBlog = await Blog.findOne({ where: { slug } });
        if (existingBlog) slug = `${slug}-${Math.floor(Math.random() * 1000)}`;

        const newBlog = await Blog.create({
            ...payload,
            slug,
        });
        res.status(201).json(sanitizeBlogRecord(newBlog));
    } catch (error) {
        console.error("Lỗi createBlog:", error);
        res.status(500).json({ message: "Lỗi tạo bài viết", error: error.message });
    }
};

const updateBlog = async (req, res) => {
    try {
        const blog = await Blog.findByPk(req.params.id);
        if (!blog) return res.status(404).json({ message: "Không tìm thấy bài viết" });

        const payload = buildBlogPayload({ ...blog.toJSON(), ...req.body });
        if (!payload.title || !payload.content) {
            return res.status(400).json({ message: "Tiêu đề và nội dung bài viết là bắt buộc" });
        }
        await blog.update(payload);
        res.status(200).json(sanitizeBlogRecord(blog));
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

const deleteAllBlogs = async (req, res) => {
    try {
        const deletedCount = await Blog.destroy({ where: {} });
        res.status(200).json({
            message: `Đã xóa ${deletedCount} bài viết`,
            deletedCount,
        });
    } catch (error) {
        console.error("Lỗi deleteAllBlogs:", error);
        res.status(500).json({ message: "Lỗi xóa tất cả bài viết", error: error.message });
    }
};

const getBlogById = async (req, res) => {
    try {
        const blog = await Blog.findByPk(req.params.id);
        if (!blog) return res.status(404).json({ message: "Không tìm thấy bài viết" });
        res.status(200).json(sanitizeBlogRecord(blog));
    } catch (error) {
        console.error("Lỗi getBlogById:", error);
        res.status(500).json({ message: "Lỗi máy chủ", error: error.message });
    }
};

const addComment = async (req, res) => {
    try {
        const text = sanitizePlainText(req.body.text).slice(0, 1000);
        const { parentId } = req.body;
        if (!text) return res.status(400).json({ message: "Bình luận không được để trống" });

        const blog = await Blog.findByPk(req.params.id);
        if (!blog) return res.status(404).json({ message: "Không tìm thấy bài viết" });

        const comments = blog.comments ? [...blog.comments] : [];
        const newComment = {
            id: Date.now().toString(),
            userId: req.user.id,
            userName: req.user.name || "Khách",
            userAvatar: req.user.avatarUrl || null,
            text,
            createdAt: new Date().toISOString(),
            replies: []
        };

        if (parentId) {
            const parentIndex = comments.findIndex(c => c.id === parentId);
            if (parentIndex !== -1) {
                if (!comments[parentIndex].replies) comments[parentIndex].replies = [];
                comments[parentIndex].replies.push({ ...newComment, parentId });
            } else {
                return res.status(400).json({ message: "Không tìm thấy bình luận gốc" });
            }
        } else {
            comments.push(newComment);
        }

        blog.comments = comments;
        blog.changed("comments", true);
        await blog.save();

        res.status(200).json(sanitizeBlogRecord(blog));
    } catch (error) {
        console.error("Lỗi addComment:", error);
        res.status(500).json({ message: "Lỗi thêm bình luận", error: error.message });
    }
};

module.exports = {
    getAllBlogs,
    getBlogBySlug,
    createBlog,
    updateBlog,
    deleteBlog,
    deleteAllBlogs,
    getBlogById,
    addComment,
};

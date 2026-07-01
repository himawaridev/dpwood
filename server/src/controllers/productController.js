const Product = require("../models/product");

// ==========================================
// [PUBLIC] ROUTE KHÁCH HÀNG
// ==========================================
const getAllProducts = async (req, res) => {
    try {
        const products = await Product.findAll({ order: [["createdAt", "DESC"]] });
        res.status(200).json(products);
    } catch (error) {
        console.error("Lỗi getAllProducts:", error);
        res.status(500).json({ message: "Lỗi khi lấy danh sách sản phẩm", error: error.message });
    }
};

const getProductById = async (req, res) => {
    try {
        const product = await Product.findByPk(req.params.id);
        if (!product) return res.status(404).json({ message: "Sản phẩm không tồn tại" });

        res.status(200).json(product);
    } catch (error) {
        console.error("Lỗi getProductById:", error);
        res.status(500).json({ message: "Lỗi máy chủ", error: error.message });
    }
};

const rateProduct = async (req, res) => {
    try {
        const product = await Product.findByPk(req.params.id);
        if (!product) return res.status(404).json({ message: "Sản phẩm không tồn tại" });

        const ratingValue = Number(req.body.rating);
        if (!Number.isFinite(ratingValue) || ratingValue < 1 || ratingValue > 5) {
            return res.status(400).json({ message: "Điểm đánh giá phải từ 1 đến 5 sao" });
        }

        const currentRating = Number(product.rating || 0);
        const currentCount = Number(product.ratingCount || 0);
        const nextCount = currentCount + 1;
        const nextRating = ((currentRating * currentCount) + ratingValue) / nextCount;

        await product.update({
            rating: Number(nextRating.toFixed(2)),
            ratingCount: nextCount,
        });

        res.status(200).json({
            message: "Cảm ơn bạn đã đánh giá sản phẩm",
            product,
        });
    } catch (error) {
        console.error("Lỗi rateProduct:", error);
        res.status(500).json({ message: "Lỗi khi đánh giá sản phẩm", error: error.message });
    }
};

// ==========================================
// [ADMIN] ROUTE QUẢN TRỊ VIÊN
// ==========================================
const createProduct = async (req, res) => {
    try {
        const { name, description, price, stock, imageUrl, images } = req.body;
        if (!name || !price)
            return res.status(400).json({ message: "Tên và giá sản phẩm là bắt buộc" });

        const newProduct = await Product.create({
            name,
            description,
            price,
            stock,
            imageUrl,
            images,
        });
        res.status(201).json({ message: "Thêm sản phẩm thành công", product: newProduct });
    } catch (error) {
        console.error("Lỗi createProduct:", error);
        res.status(500).json({ message: "Lỗi khi thêm sản phẩm", error: error.message });
    }
};

const updateProduct = async (req, res) => {
    try {
        const product = await Product.findByPk(req.params.id);
        if (!product) return res.status(404).json({ message: "Không tìm thấy sản phẩm" });

        await product.update(req.body);
        res.status(200).json({ message: "Cập nhật sản phẩm thành công", product });
    } catch (error) {
        console.error("Lỗi updateProduct:", error);
        res.status(500).json({ message: "Lỗi khi cập nhật sản phẩm", error: error.message });
    }
};

const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findByPk(req.params.id);
        if (!product) return res.status(404).json({ message: "Không tìm thấy sản phẩm" });

        await product.destroy();
        res.status(200).json({ message: "Đã xóa sản phẩm thành công" });
    } catch (error) {
        console.error("Lỗi deleteProduct:", error);
        res.status(500).json({ message: "Lỗi khi xóa sản phẩm", error: error.message });
    }
};

module.exports = { getAllProducts, getProductById, rateProduct, createProduct, updateProduct, deleteProduct };

const Product = require("../models/product");

// 1. Lấy danh sách tất cả sản phẩm (Public)
const getAllProducts = async (req, res) => {
    try {
        const products = await Product.findAll({
            order: [["createdAt", "DESC"]], // Sản phẩm mới nhất lên đầu
        });
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: "Lỗi khi lấy danh sách sản phẩm", error: error.message });
    }
};

// 2. Thêm sản phẩm mới (Chỉ Admin/Root)
const createProduct = async (req, res) => {
    try {
        const { name, description, price, stock, imageUrl } = req.body;

        // Validate cơ bản
        if (!name || !price) {
            return res.status(400).json({ message: "Tên và giá sản phẩm là bắt buộc" });
        }

        const newProduct = await Product.create({
            name,
            description,
            price,
            stock,
            imageUrl,
        });

        res.status(201).json({ message: "Thêm sản phẩm thành công", product: newProduct });
    } catch (error) {
        res.status(500).json({ message: "Lỗi khi thêm sản phẩm", error: error.message });
    }
};

// 3. Cập nhật sản phẩm (Chỉ Admin/Root)
const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, price, stock, imageUrl } = req.body;

        const product = await Product.findByPk(id);
        if (!product) {
            return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
        }

        await product.update({ name, description, price, stock, imageUrl });
        res.json({ message: "Cập nhật sản phẩm thành công", product });
    } catch (error) {
        res.status(500).json({ message: "Lỗi khi cập nhật sản phẩm", error: error.message });
    }
};

// 4. Xóa sản phẩm (Chỉ Admin/Root)
const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;

        const product = await Product.findByPk(id);
        if (!product) {
            return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
        }

        await product.destroy();
        res.json({ message: "Đã xóa sản phẩm thành công" });
    } catch (error) {
        res.status(500).json({ message: "Lỗi khi xóa sản phẩm", error: error.message });
    }
};

module.exports = {
    getAllProducts,
    createProduct,
    updateProduct,
    deleteProduct,
};

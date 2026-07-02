const Product = require("../models/product");
const ProductRating = require("../models/productRating");

const normalizeRating = (rating) => {
    const ratingValue = Number(rating);
    if (!Number.isFinite(ratingValue) || ratingValue < 1 || ratingValue > 5) return null;
    return Math.min(5, Math.max(1, Math.round(ratingValue * 2) / 2));
};

const refreshProductRatingSummary = async (product) => {
    const ratings = await ProductRating.findAll({
        where: { productId: product.id },
        attributes: ["rating"],
    });

    const ratingCount = ratings.length;
    const averageRating = ratingCount
        ? ratings.reduce((sum, item) => sum + Number(item.rating || 0), 0) / ratingCount
        : 0;

    await product.update({
        rating: Number(averageRating.toFixed(2)),
        ratingCount,
    });

    return product;
};

const getAllProducts = async (req, res) => {
    try {
        const products = await Product.findAll({ order: [["createdAt", "DESC"]] });
        res.status(200).json(products);
    } catch (error) {
        console.error("getAllProducts error:", error);
        res.status(500).json({ message: "Khong the lay danh sach san pham", error: error.message });
    }
};

const getProductById = async (req, res) => {
    try {
        const product = await Product.findByPk(req.params.id);
        if (!product) return res.status(404).json({ message: "San pham khong ton tai" });

        res.status(200).json(product);
    } catch (error) {
        console.error("getProductById error:", error);
        res.status(500).json({ message: "Loi may chu", error: error.message });
    }
};

const getMyProductRating = async (req, res) => {
    try {
        const product = await Product.findByPk(req.params.id);
        if (!product) return res.status(404).json({ message: "San pham khong ton tai" });

        const rating = await ProductRating.findOne({
            where: {
                productId: product.id,
                userId: req.user.id,
            },
        });

        res.status(200).json({ rating: rating ? Number(rating.rating) : 0 });
    } catch (error) {
        console.error("getMyProductRating error:", error);
        res.status(500).json({ message: "Khong the lay danh gia san pham", error: error.message });
    }
};

const rateProduct = async (req, res) => {
    try {
        const product = await Product.findByPk(req.params.id);
        if (!product) return res.status(404).json({ message: "San pham khong ton tai" });

        const ratingValue = normalizeRating(req.body.rating);
        if (!ratingValue) {
            return res.status(400).json({ message: "Diem danh gia phai tu 1 den 5 sao" });
        }

        await ProductRating.upsert({
            productId: product.id,
            userId: req.user.id,
            rating: ratingValue,
        });

        await refreshProductRatingSummary(product);

        res.status(200).json({
            message: "Cam on ban da danh gia san pham",
            product,
            userRating: ratingValue,
        });
    } catch (error) {
        console.error("rateProduct error:", error);
        res.status(500).json({ message: "Khong the danh gia san pham", error: error.message });
    }
};

const createProduct = async (req, res) => {
    try {
        const {
            name,
            description,
            price,
            stock,
            imageUrl,
            images,
            variants,
            category,
            material,
            color,
            brand,
            capacity,
            warranty,
            origin,
            dishwasherSafe,
            microwaveSafe,
        } = req.body;
        if (!name || !price) {
            return res.status(400).json({ message: "Ten va gia san pham la bat buoc" });
        }

        const newProduct = await Product.create({
            name,
            description,
            price,
            stock,
            imageUrl,
            images,
            variants,
            category,
            material,
            color,
            brand,
            capacity,
            warranty,
            origin,
            dishwasherSafe,
            microwaveSafe,
        });
        res.status(201).json({ message: "Them san pham thanh cong", product: newProduct });
    } catch (error) {
        console.error("createProduct error:", error);
        res.status(500).json({ message: "Khong the them san pham", error: error.message });
    }
};

const updateProduct = async (req, res) => {
    try {
        const product = await Product.findByPk(req.params.id);
        if (!product) return res.status(404).json({ message: "Khong tim thay san pham" });

        await product.update(req.body);
        res.status(200).json({ message: "Cap nhat san pham thanh cong", product });
    } catch (error) {
        console.error("updateProduct error:", error);
        res.status(500).json({ message: "Khong the cap nhat san pham", error: error.message });
    }
};

const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findByPk(req.params.id);
        if (!product) return res.status(404).json({ message: "Khong tim thay san pham" });

        await ProductRating.destroy({ where: { productId: product.id } });
        await product.destroy();
        res.status(200).json({ message: "Da xoa san pham thanh cong" });
    } catch (error) {
        console.error("deleteProduct error:", error);
        res.status(500).json({ message: "Khong the xoa san pham", error: error.message });
    }
};

module.exports = {
    getAllProducts,
    getProductById,
    getMyProductRating,
    rateProduct,
    createProduct,
    updateProduct,
    deleteProduct,
};

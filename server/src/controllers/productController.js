const Product = require("../models/product");
const ProductRating = require("../models/productRating");
const Wishlist = require("../models/wishlist");
const AuditLog = require("../models/auditLog");
const { sequelize } = require("../config/connectSequelize");
const { Op } = require("sequelize");

const normalizeText = (value = "") =>
    String(value)
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[đĐ]/g, "d")
        .toLowerCase();

const parseNumber = (value, fallback = null) => {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
};

const productSearchText = (product) =>
    normalizeText(
        [
            product.name,
            product.description,
            product.category,
            product.material,
            product.color,
            product.brand,
            product.capacity,
            product.warranty,
            product.origin,
        ].join(" "),
    );

const productMatchesQuery = (product, query) => {
    const terms = normalizeText(query).split(/\s+/).filter(Boolean);
    if (!terms.length) return true;
    const text = productSearchText(product);
    return terms.every((term) => text.includes(term));
};

const productMatchesList = (value, selected) => {
    if (!selected?.length) return true;
    return selected.includes(String(value || ""));
};

const normalizeListParam = (value) =>
    String(value || "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

const buildProductFacets = (products) => {
    const facetValues = (key) =>
        [...new Set(products.map((product) => product[key]).filter(Boolean))]
            .sort((a, b) => String(a).localeCompare(String(b), "vi"));

    return {
        categories: facetValues("category"),
        materials: facetValues("material"),
        colors: facetValues("color"),
        brands: facetValues("brand"),
        capacities: facetValues("capacity"),
        price: {
            min: products.length ? Math.min(...products.map((product) => Number(product.price || 0))) : 0,
            max: products.length ? Math.max(...products.map((product) => Number(product.price || 0))) : 0,
        },
    };
};

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
        const allProducts = await Product.findAll({
            where: { isActive: true },
            order: [["createdAt", "DESC"]],
        });
        const query = req.query.search || req.query.q || "";
        const categories = normalizeListParam(req.query.category);
        const colors = normalizeListParam(req.query.color);
        const materials = normalizeListParam(req.query.material);
        const brands = normalizeListParam(req.query.brand);
        const minPrice = parseNumber(req.query.minPrice);
        const maxPrice = parseNumber(req.query.maxPrice);
        const minRating = parseNumber(req.query.minRating);
        const onlyInStock = String(req.query.inStock || "").toLowerCase() === "true";
        const sortBy = String(req.query.sort || req.query.sortBy || "newest");

        let products = allProducts.filter((product) => {
            const price = Number(product.price || 0);
            const rating = Number(product.rating || 0);
            return (
                productMatchesQuery(product, query) &&
                productMatchesList(product.category, categories) &&
                productMatchesList(product.color, colors) &&
                productMatchesList(product.material, materials) &&
                productMatchesList(product.brand, brands) &&
                (minPrice === null || price >= minPrice) &&
                (maxPrice === null || price <= maxPrice) &&
                (minRating === null || rating >= minRating) &&
                (!onlyInStock || Number(product.stock || 0) > 0)
            );
        });

        products = products.sort((a, b) => {
            if (sortBy === "priceAsc") return Number(a.price || 0) - Number(b.price || 0);
            if (sortBy === "priceDesc") return Number(b.price || 0) - Number(a.price || 0);
            if (sortBy === "sold") return Number(b.sold || 0) - Number(a.sold || 0);
            if (sortBy === "rating") return Number(b.rating || 0) - Number(a.rating || 0);
            return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        });

        if (String(req.query.withFacets || "").toLowerCase() === "true") {
            return res.status(200).json({
                products,
                facets: buildProductFacets(allProducts),
            });
        }

        res.status(200).json(products);
    } catch (error) {
        console.error("getAllProducts error:", error);
        res.status(500).json({ message: "Khong the lay danh sach san pham", error: error.message });
    }
};

const getRelatedProducts = async (req, res) => {
    try {
        const currentProduct = await Product.findOne({
            where: { id: req.params.id, isActive: true },
        });
        if (!currentProduct) return res.status(404).json({ message: "San pham khong ton tai" });

        const products = await Product.findAll({
            where: { id: { [Op.ne]: currentProduct.id }, isActive: true },
            limit: 80,
        });
        const currentText = productSearchText(currentProduct);
        const currentTokens = new Set(currentText.split(/\s+/).filter((token) => token.length >= 3));

        const scored = products
            .map((product) => {
                const text = productSearchText(product);
                const overlapScore = [...currentTokens].filter((token) => text.includes(token)).length;
                const categoryScore = product.category && product.category === currentProduct.category ? 80 : 0;
                const materialScore = product.material && product.material === currentProduct.material ? 35 : 0;
                const brandScore = product.brand && product.brand === currentProduct.brand ? 20 : 0;
                const ratingScore = Number(product.rating || 0) * 4;
                const soldScore = Math.min(30, Number(product.sold || 0));
                return {
                    product,
                    score: categoryScore + materialScore + brandScore + overlapScore + ratingScore + soldScore,
                };
            })
            .sort((a, b) => b.score - a.score || new Date(b.product.createdAt || 0) - new Date(a.product.createdAt || 0))
            .slice(0, 8)
            .map((item) => item.product);

        res.status(200).json(scored);
    } catch (error) {
        console.error("getRelatedProducts error:", error);
        res.status(500).json({ message: "Khong the lay san pham lien quan", error: error.message });
    }
};

const getMyWishlist = async (req, res) => {
    try {
        const wishlistItems = await Wishlist.findAll({
            where: { userId: req.user.id },
            include: [{ model: Product }],
            order: [["createdAt", "DESC"]],
        });

        res.status(200).json(
            wishlistItems.map((item) => ({
                id: item.id,
                productId: item.productId,
                createdAt: item.createdAt,
                Product: item.Product,
            })),
        );
    } catch (error) {
        console.error("getMyWishlist error:", error);
        res.status(500).json({ message: "Khong the lay wishlist", error: error.message });
    }
};

const toggleWishlist = async (req, res) => {
    try {
        const product = await Product.findOne({ where: { id: req.params.id, isActive: true } });
        if (!product) return res.status(404).json({ message: "San pham khong ton tai" });

        const existing = await Wishlist.findOne({
            where: {
                userId: req.user.id,
                productId: product.id,
            },
        });

        if (existing) {
            await existing.destroy();
            return res.status(200).json({ wished: false, productId: product.id });
        }

        await Wishlist.create({
            userId: req.user.id,
            productId: product.id,
        });

        res.status(201).json({ wished: true, productId: product.id });
    } catch (error) {
        console.error("toggleWishlist error:", error);
        res.status(500).json({ message: "Khong the cap nhat wishlist", error: error.message });
    }
};

const getProductById = async (req, res) => {
    try {
        const product = await Product.findOne({ where: { id: req.params.id, isActive: true } });
        if (!product) return res.status(404).json({ message: "San pham khong ton tai" });

        res.status(200).json(product);
    } catch (error) {
        console.error("getProductById error:", error);
        res.status(500).json({ message: "Loi may chu", error: error.message });
    }
};

const getMyProductRating = async (req, res) => {
    try {
        const product = await Product.findOne({ where: { id: req.params.id, isActive: true } });
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
        const product = await Product.findOne({ where: { id: req.params.id, isActive: true } });
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
        const product = await Product.findOne({ where: { id: req.params.id, isActive: true } });
        if (!product) return res.status(404).json({ message: "Khong tim thay san pham" });

        const editableFields = [
            "name",
            "description",
            "imageUrl",
            "images",
            "category",
            "material",
            "color",
            "brand",
            "capacity",
            "warranty",
            "origin",
            "dishwasherSafe",
            "microwaveSafe",
        ];
        const updates = {};
        for (const field of editableFields) {
            if (Object.prototype.hasOwnProperty.call(req.body, field)) updates[field] = req.body[field];
        }

        if (Object.prototype.hasOwnProperty.call(req.body, "price")) {
            const price = Number(req.body.price);
            if (!Number.isFinite(price) || price < 0) {
                return res.status(400).json({ message: "Gia san pham khong hop le" });
            }
            updates.price = price;
        }

        if (Object.prototype.hasOwnProperty.call(req.body, "stock")) {
            const stock = Number(req.body.stock);
            if (!Number.isInteger(stock) || stock < 0) {
                return res.status(400).json({ message: "Ton kho phai la so nguyen khong am" });
            }
            updates.stock = stock;
        }

        if (Object.prototype.hasOwnProperty.call(req.body, "variants")) {
            if (!Array.isArray(req.body.variants)) {
                return res.status(400).json({ message: "Danh sach bien the khong hop le" });
            }

            const variants = [];
            for (const variant of req.body.variants) {
                if (!variant || typeof variant !== "object") {
                    return res.status(400).json({ message: "Du lieu bien the khong hop le" });
                }

                const variantPrice = Number(variant.price ?? updates.price ?? product.price);
                const variantStock = Number(variant.stock);
                if (!Number.isFinite(variantPrice) || variantPrice < 0) {
                    return res.status(400).json({ message: "Gia bien the khong hop le" });
                }
                if (!Number.isInteger(variantStock) || variantStock < 0) {
                    return res.status(400).json({ message: "Ton kho bien the phai la so nguyen khong am" });
                }

                variants.push({
                    variantId: String(variant.variantId || `variant-${Date.now()}-${variants.length}`),
                    color: String(variant.color || "").trim(),
                    size: String(variant.size || variant.capacity || "").trim(),
                    price: variantPrice,
                    stock: variantStock,
                    imageUrl: String(variant.imageUrl || "").trim(),
                });
            }

            updates.variants = variants;
            if (variants.length) {
                updates.stock = variants.reduce((sum, variant) => sum + variant.stock, 0);
            }
        }

        await product.update(updates);
        await product.reload();
        res.status(200).json({ message: "Cap nhat san pham thanh cong", product });
    } catch (error) {
        console.error("updateProduct error:", error);
        res.status(500).json({ message: "Khong the cap nhat san pham", error: error.message });
    }
};

const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findOne({ where: { id: req.params.id, isActive: true } });
        if (!product) return res.status(404).json({ message: "Khong tim thay san pham" });

        await ProductRating.destroy({ where: { productId: product.id } });
        await Wishlist.destroy({ where: { productId: product.id } });
        await product.update({ isActive: false, stock: 0 });
        res.status(200).json({ message: "Da xoa san pham thanh cong" });
    } catch (error) {
        console.error("deleteProduct error:", error);
        res.status(500).json({ message: "Khong the xoa san pham", error: error.message });
    }
};

const deleteAllProducts = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const productCount = await Product.count({
            where: { isActive: true },
            transaction,
        });

        if (!productCount) {
            await transaction.rollback();
            return res.status(200).json({ message: "Kho san pham da trong", deletedCount: 0 });
        }

        await Wishlist.destroy({ where: {}, transaction });
        await ProductRating.destroy({ where: {}, transaction });
        await Product.update(
            { isActive: false, stock: 0 },
            { where: { isActive: true }, transaction },
        );
        await AuditLog.create(
            {
                userId: req.user.id,
                action: "ALL_PRODUCTS_ARCHIVED",
                details: `Da xoa ${productCount} san pham khoi cua hang; lich su don hang duoc giu lai.`,
            },
            { transaction },
        );

        await transaction.commit();
        res.status(200).json({
            message: `Da xoa ${productCount} san pham khoi cua hang`,
            deletedCount: productCount,
        });
    } catch (error) {
        await transaction.rollback();
        console.error("deleteAllProducts error:", error);
        res.status(500).json({ message: "Khong the xoa toan bo san pham", error: error.message });
    }
};

module.exports = {
    getAllProducts,
    getProductById,
    getRelatedProducts,
    getMyWishlist,
    toggleWishlist,
    getMyProductRating,
    rateProduct,
    createProduct,
    updateProduct,
    deleteProduct,
    deleteAllProducts,
};

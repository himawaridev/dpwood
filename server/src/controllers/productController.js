const Product = require("../models/product");
const ProductRating = require("../models/productRating");
const Wishlist = require("../models/wishlist");
const AuditLog = require("../models/auditLog");
const ProductCategory = require("../models/productCategory");
const Order = require("../models/order");
const OrderItem = require("../models/orderItem");
const User = require("../models/user");
const { sequelize } = require("../config/connectSequelize");
const { Op, fn, col } = require("sequelize");
const { normalizeProductImagePayload } = require("../utils/productImageUrl");
const { normalizeProductPayload, validateProductPayload } = require("../utils/productData");

const productForResponse = (product) =>
    normalizeProductImagePayload(product?.toJSON ? product.toJSON() : product);

const slugifyCategory = (value = "") =>
    String(value)
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[đĐ]/g, "d")
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 100);

const getActiveProductCategories = () =>
    ProductCategory.findAll({
        where: { isActive: true },
        order: [["sortOrder", "ASC"], ["label", "ASC"]],
    });

const getProductCategories = async (req, res) => {
    try {
        const categories = await getActiveProductCategories();
        res.status(200).json(categories);
    } catch (error) {
        console.error("getProductCategories error:", error);
        res.status(500).json({ message: "Không thể tải danh mục sản phẩm", error: error.message });
    }
};

const createProductCategory = async (req, res) => {
    try {
        const label = String(req.body.label || "").trim();
        const value = slugifyCategory(req.body.value || label);
        if (!label || !value) {
            return res.status(400).json({ message: "Tên danh mục không hợp lệ" });
        }

        const existing = await ProductCategory.findOne({ where: { value } });
        if (existing) {
            if (!existing.isActive) {
                await existing.update({
                    label,
                    imageUrl: String(req.body.imageUrl || "").trim() || null,
                    description: String(req.body.description || "").trim() || null,
                    isActive: true,
                });
                return res.status(200).json(existing);
            }
            return res.status(409).json({ message: "Danh mục này đã tồn tại" });
        }

        const maxSortOrder = (await ProductCategory.max("sortOrder")) || 0;
        const category = await ProductCategory.create({
            value,
            label,
            imageUrl: String(req.body.imageUrl || "").trim() || null,
            description: String(req.body.description || "").trim() || null,
            sortOrder: Number.isInteger(Number(req.body.sortOrder))
                ? Number(req.body.sortOrder)
                : Number(maxSortOrder) + 1,
        });
        res.status(201).json(category);
    } catch (error) {
        console.error("createProductCategory error:", error);
        res.status(500).json({ message: "Không thể tạo danh mục", error: error.message });
    }
};

const updateProductCategory = async (req, res) => {
    try {
        const category = await ProductCategory.findByPk(req.params.id);
        if (!category) return res.status(404).json({ message: "Không tìm thấy danh mục" });

        const label = String(req.body.label ?? category.label).trim();
        if (!label) return res.status(400).json({ message: "Tên danh mục không được để trống" });

        await category.update({
            label,
            imageUrl:
                req.body.imageUrl !== undefined
                    ? String(req.body.imageUrl || "").trim() || null
                    : category.imageUrl,
            description:
                req.body.description !== undefined
                    ? String(req.body.description || "").trim() || null
                    : category.description,
            sortOrder:
                req.body.sortOrder !== undefined ? Number(req.body.sortOrder) || 0 : category.sortOrder,
        });
        res.status(200).json(category);
    } catch (error) {
        console.error("updateProductCategory error:", error);
        res.status(500).json({ message: "Không thể cập nhật danh mục", error: error.message });
    }
};

const deleteProductCategory = async (req, res) => {
    try {
        const category = await ProductCategory.findByPk(req.params.id);
        if (!category) return res.status(404).json({ message: "Không tìm thấy danh mục" });

        const productCount = await Product.count({ where: { category: category.value, isActive: true } });
        if (productCount > 0) {
            return res.status(409).json({
                message: `Danh mục đang có ${productCount} sản phẩm nên chưa thể xóa`,
            });
        }

        await category.update({ isActive: false });
        res.status(200).json({ message: "Đã xóa danh mục" });
    } catch (error) {
        console.error("deleteProductCategory error:", error);
        res.status(500).json({ message: "Không thể xóa danh mục", error: error.message });
    }
};

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

const refreshProductRatingSummary = async (product, transaction = null) => {
    const summary = await ProductRating.findOne({
        where: { productId: product.id },
        attributes: [
            [fn("COUNT", col("id")), "ratingCount"],
            [fn("AVG", col("rating")), "averageRating"],
        ],
        raw: true,
        transaction,
    });

    const ratingCount = Number(summary?.ratingCount || 0);
    const averageRating = Number(summary?.averageRating || 0);

    await product.update({
        rating: Number(averageRating.toFixed(2)),
        ratingCount,
    }, { transaction });

    return product;
};

const findVerifiedPurchase = async (userId, product) => {
    const equivalentProducts = await Product.findAll({
        where: {
            [Op.or]: [
                { id: product.id },
                ...(product.name ? [{ name: product.name }] : []),
            ],
        },
        attributes: ["id"],
        paranoid: false,
    });
    const productIds = [...new Set([product.id, ...equivalentProducts.map((item) => item.id)])];
    return OrderItem.findOne({
        where: { productId: { [Op.in]: productIds } },
        include: [{
            model: Order,
            required: true,
            where: {
                userId,
                [Op.or]: [
                    { status: "COMPLETED" },
                    { paymentMethod: "QR", status: { [Op.in]: ["PAID", "SHIPPING"] } },
                ],
            },
            attributes: ["id", "orderCode", "status", "paymentMethod", "createdAt"],
        }],
        order: [[Order, "createdAt", "DESC"]],
    });
};

const getAllProducts = async (req, res) => {
    try {
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
        const usePagination = req.query.page !== undefined || req.query.limit !== undefined;
        const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
        const limit = Math.min(60, Math.max(1, Number.parseInt(req.query.limit, 10) || 12));
        const where = { isActive: true };
        const and = [];
        if (query.trim()) {
            const pattern = `%${query.trim()}%`;
            and.push({
                [Op.or]: ["name", "description", "sku", "category", "material", "brand", "capacity"].map(
                    (field) => ({ [field]: { [Op.like]: pattern } }),
                ),
            });
        }
        if (categories.length) and.push({ category: { [Op.in]: categories } });
        if (colors.length) and.push({ color: { [Op.in]: colors } });
        if (materials.length) and.push({ material: { [Op.in]: materials } });
        if (brands.length) and.push({ brand: { [Op.in]: brands } });
        if (minPrice !== null || maxPrice !== null) {
            const priceWhere = {};
            if (minPrice !== null) priceWhere[Op.gte] = minPrice;
            if (maxPrice !== null) priceWhere[Op.lte] = maxPrice;
            and.push({ price: priceWhere });
        }
        if (minRating !== null && minRating > 0) and.push({ rating: { [Op.gte]: minRating } });
        if (onlyInStock) and.push({ stock: { [Op.gt]: 0 } });
        const ids = normalizeListParam(req.query.ids).slice(0, 500);
        if (ids.length) and.push({ id: { [Op.in]: ids } });
        if (and.length) where[Op.and] = and;

        const sortMap = {
            priceAsc: [["price", "ASC"]],
            priceDesc: [["price", "DESC"]],
            sold: [["sold", "DESC"]],
            rating: [["rating", "DESC"], ["ratingCount", "DESC"]],
            newest: [["createdAt", "DESC"]],
        };
        const result = await Product.findAndCountAll({
            where,
            order: sortMap[sortBy] || sortMap.newest,
            distinct: true,
            ...(usePagination ? { limit, offset: (page - 1) * limit } : {}),
        });
        const categoryRows = await getActiveProductCategories();
        const categoryLabels = new Map(categoryRows.map((item) => [item.value, item.label]));
        const products = result.rows.map((product) => {
            const normalized = productForResponse(product);
            return { ...normalized, categoryLabel: categoryLabels.get(normalized.category) || normalized.category };
        });

        if (String(req.query.withFacets || "").toLowerCase() === "true" || usePagination) {
            const facetRows = await Product.findAll({
                where: { isActive: true },
                attributes: ["category", "material", "color", "brand", "capacity", "price"],
            });
            return res.status(200).json({
                products,
                facets: buildProductFacets(facetRows.map((item) => item.toJSON())),
                pagination: {
                    page,
                    limit: usePagination ? limit : result.count,
                    total: result.count,
                    totalPages: usePagination ? Math.max(1, Math.ceil(result.count / limit)) : 1,
                },
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

        res.status(200).json(scored.map(productForResponse));
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
                Product: productForResponse(item.Product),
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

        const category = await ProductCategory.findOne({
            where: { value: product.category, isActive: true },
        });
        res.status(200).json({
            ...productForResponse(product),
            categoryLabel: category?.label || product.category,
        });
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

        const purchase = await findVerifiedPurchase(req.user.id, product);
        res.status(200).json({
            rating: rating ? Number(rating.rating) : 0,
            comment: rating?.comment || "",
            images: Array.isArray(rating?.images) ? rating.images : [],
            canRate: Boolean(purchase),
            isVerifiedPurchase: Boolean(rating?.isVerifiedPurchase),
            eligibilityMessage: purchase
                ? "Bạn đã thanh toán sản phẩm này và có thể đánh giá hoặc cập nhật đánh giá."
                : "Chỉ khách hàng có đơn đã thanh toán hoặc hoàn tất mới có thể đánh giá sản phẩm.",
        });
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

        const purchase = await findVerifiedPurchase(req.user.id, product);
        if (!purchase) {
            return res.status(403).json({
                message: "Chỉ khách hàng có đơn đã thanh toán hoặc hoàn tất mới có thể đánh giá sản phẩm này.",
            });
        }

        const comment = String(req.body.comment || "").trim().slice(0, 2000);
        const reviewImages = normalizeProductImagePayload({ images: req.body.images }).images.slice(0, 5);

        await ProductRating.upsert({
            productId: product.id,
            userId: req.user.id,
            rating: ratingValue,
            comment: comment || null,
            images: reviewImages,
            isVerifiedPurchase: true,
            orderId: purchase.orderId,
            source: "CUSTOMER",
            managedById: null,
        });

        await refreshProductRatingSummary(product);

        res.status(200).json({
            message: "Cam on ban da danh gia san pham",
            product,
            userRating: ratingValue,
            comment,
            isVerifiedPurchase: true,
        });
    } catch (error) {
        console.error("rateProduct error:", error);
        res.status(500).json({ message: "Khong the danh gia san pham", error: error.message });
    }
};

const createProduct = async (req, res) => {
    try {
        const payload = normalizeProductPayload(req.body);
        const validationErrors = validateProductPayload(payload);
        if (validationErrors.length) {
            return res.status(400).json({ message: validationErrors[0], errors: validationErrors });
        }
        const existingSku = await Product.findOne({ where: { sku: payload.sku } });
        if (existingSku) return res.status(409).json({ message: "SKU đã tồn tại" });

        const newProduct = await Product.create(payload);
        res.status(201).json({ message: "Them san pham thanh cong", product: productForResponse(newProduct) });
    } catch (error) {
        console.error("createProduct error:", error);
        res.status(500).json({ message: "Khong the them san pham", error: error.message });
    }
};

const updateProduct = async (req, res) => {
    try {
        const product = await Product.findOne({ where: { id: req.params.id, isActive: true } });
        if (!product) return res.status(404).json({ message: "Khong tim thay san pham" });

        const payload = normalizeProductPayload(req.body, product.toJSON());
        const validationErrors = validateProductPayload(payload);
        if (validationErrors.length) {
            return res.status(400).json({ message: validationErrors[0], errors: validationErrors });
        }
        const existingSku = await Product.findOne({
            where: { sku: payload.sku, id: { [Op.ne]: product.id } },
        });
        if (existingSku) return res.status(409).json({ message: "SKU đã tồn tại" });

        const editableFields = [
            "name", "description", "sku", "gtin", "mpn", "price", "stock", "sold",
            "imageUrl", "images", "variants", "category", "material", "color", "brand",
            "capacity", "dimensions", "weight", "warranty", "origin", "packageContents",
            "careInstructions", "safetyInstructions", "specifications", "dishwasherSafe",
            "microwaveSafe", "returnEligible", "returnWindowDays",
        ];
        const updates = Object.fromEntries(editableFields.map((field) => [field, payload[field]]));
        await product.update(updates);
        await product.reload();
        res.status(200).json({ message: "Cap nhat san pham thanh cong", product: productForResponse(product) });
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

const getProductReviews = async (req, res) => {
    try {
        const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
        const limit = Math.min(20, Math.max(1, Number.parseInt(req.query.limit, 10) || 6));
        const product = await Product.findOne({ where: { id: req.params.id, isActive: true }, attributes: ["id"] });
        if (!product) return res.status(404).json({ message: "Sản phẩm không tồn tại" });

        const result = await ProductRating.findAndCountAll({
            where: { productId: product.id },
            include: [{ model: User, attributes: ["id", "name", "avatarUrl"] }],
            order: [["updatedAt", "DESC"]],
            limit,
            offset: (page - 1) * limit,
        });
        res.status(200).json({
            reviews: result.rows.map((review) => ({
                id: review.id,
                rating: Number(review.rating),
                comment: review.comment || "",
                images: Array.isArray(review.images) ? review.images : [],
                isVerifiedPurchase: Boolean(review.isVerifiedPurchase),
                source: review.source || "CUSTOMER",
                updatedAt: review.updatedAt,
                user: review.User
                    ? { id: review.User.id, name: review.User.name, avatarUrl: review.User.avatarUrl }
                    : null,
            })),
            pagination: { page, limit, total: result.count, totalPages: Math.max(1, Math.ceil(result.count / limit)) },
        });
    } catch (error) {
        console.error("getProductReviews error:", error);
        res.status(500).json({ message: "Không thể tải đánh giá sản phẩm", error: error.message });
    }
};

const getAdminProductRatings = async (req, res) => {
    try {
        const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
        const limit = Math.min(50, Math.max(1, Number.parseInt(req.query.limit, 10) || 10));
        const search = String(req.query.search || "").trim();
        const where = {};

        if (req.query.productId) where.productId = req.query.productId;
        if (req.query.rating) where.rating = Number(req.query.rating);
        if (["CUSTOMER", "ADMIN"].includes(req.query.source)) where.source = req.query.source;
        if (req.query.verified === "true") where.isVerifiedPurchase = true;
        if (req.query.verified === "false") where.isVerifiedPurchase = false;
        if (search) {
            where[Op.or] = [
                { "$Product.name$": { [Op.like]: `%${search}%` } },
                { "$User.name$": { [Op.like]: `%${search}%` } },
                { "$User.email$": { [Op.like]: `%${search}%` } },
                { comment: { [Op.like]: `%${search}%` } },
            ];
        }

        const result = await ProductRating.findAndCountAll({
            where,
            include: [
                { model: Product, attributes: ["id", "name", "imageUrl"], required: true },
                { model: User, attributes: ["id", "name", "email", "avatarUrl"], required: true },
            ],
            order: [["updatedAt", "DESC"]],
            limit,
            offset: (page - 1) * limit,
            distinct: true,
            subQuery: false,
        });

        res.status(200).json({
            ratings: result.rows,
            pagination: {
                page,
                limit,
                total: result.count,
                totalPages: Math.max(1, Math.ceil(result.count / limit)),
            },
        });
    } catch (error) {
        console.error("getAdminProductRatings error:", error);
        res.status(500).json({ message: "Không thể tải danh sách đánh giá", error: error.message });
    }
};

const createAdminProductRating = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const ratingValue = normalizeRating(req.body.rating);
        if (!ratingValue) {
            await transaction.rollback();
            return res.status(400).json({ message: "Điểm đánh giá phải từ 1 đến 5 sao" });
        }

        const [product, user] = await Promise.all([
            Product.findOne({ where: { id: req.body.productId, isActive: true }, transaction }),
            User.findByPk(req.body.userId, { transaction }),
        ]);
        if (!product || !user) {
            await transaction.rollback();
            return res.status(404).json({ message: "Không tìm thấy sản phẩm hoặc tài khoản" });
        }

        const existing = await ProductRating.findOne({
            where: { productId: product.id, userId: user.id },
            transaction,
        });
        if (existing) {
            await transaction.rollback();
            return res.status(409).json({
                message: "Tài khoản này đã đánh giá sản phẩm. Hãy chỉnh sửa đánh giá hiện có.",
            });
        }

        const purchase = await findVerifiedPurchase(user.id, product);
        const rating = await ProductRating.create({
            productId: product.id,
            userId: user.id,
            rating: ratingValue,
            comment: String(req.body.comment || "").trim().slice(0, 2000) || null,
            images: [],
            isVerifiedPurchase: Boolean(purchase),
            orderId: purchase?.orderId || null,
            source: "ADMIN",
            managedById: req.user.id,
        }, { transaction });

        await refreshProductRatingSummary(product, transaction);
        await AuditLog.create({
            userId: req.user.id,
            action: "ADMIN_PRODUCT_RATING_CREATED",
            details: `Tao danh gia ${rating.id} cho san pham ${product.id}, tai khoan ${user.id}.`,
        }, { transaction });
        await transaction.commit();
        res.status(201).json({ message: "Đã tạo đánh giá", rating });
    } catch (error) {
        await transaction.rollback();
        console.error("createAdminProductRating error:", error);
        res.status(500).json({ message: "Không thể tạo đánh giá", error: error.message });
    }
};

const updateAdminProductRating = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const rating = await ProductRating.findByPk(req.params.ratingId, { transaction });
        if (!rating) {
            await transaction.rollback();
            return res.status(404).json({ message: "Không tìm thấy đánh giá" });
        }

        const ratingValue = normalizeRating(req.body.rating);
        if (!ratingValue) {
            await transaction.rollback();
            return res.status(400).json({ message: "Điểm đánh giá phải từ 1 đến 5 sao" });
        }

        await rating.update({
            rating: ratingValue,
            comment: String(req.body.comment || "").trim().slice(0, 2000) || null,
            source: "ADMIN",
            managedById: req.user.id,
        }, { transaction });
        const product = await Product.findByPk(rating.productId, { transaction, paranoid: false });
        if (product) await refreshProductRatingSummary(product, transaction);
        await AuditLog.create({
            userId: req.user.id,
            action: "ADMIN_PRODUCT_RATING_UPDATED",
            details: `Cap nhat danh gia ${rating.id} cho san pham ${rating.productId}.`,
        }, { transaction });
        await transaction.commit();
        res.status(200).json({ message: "Đã cập nhật đánh giá", rating });
    } catch (error) {
        await transaction.rollback();
        console.error("updateAdminProductRating error:", error);
        res.status(500).json({ message: "Không thể cập nhật đánh giá", error: error.message });
    }
};

const deleteAdminProductRating = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const rating = await ProductRating.findByPk(req.params.ratingId, { transaction });
        if (!rating) {
            await transaction.rollback();
            return res.status(404).json({ message: "Không tìm thấy đánh giá" });
        }

        const productId = rating.productId;
        await rating.destroy({ transaction });
        const product = await Product.findByPk(productId, { transaction, paranoid: false });
        if (product) await refreshProductRatingSummary(product, transaction);
        await AuditLog.create({
            userId: req.user.id,
            action: "ADMIN_PRODUCT_RATING_DELETED",
            details: `Xoa danh gia ${rating.id} cua san pham ${productId}.`,
        }, { transaction });
        await transaction.commit();
        res.status(200).json({ message: "Đã xóa đánh giá" });
    } catch (error) {
        await transaction.rollback();
        console.error("deleteAdminProductRating error:", error);
        res.status(500).json({ message: "Không thể xóa đánh giá", error: error.message });
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
    getProductCategories,
    createProductCategory,
    updateProductCategory,
    deleteProductCategory,
    getAllProducts,
    getProductById,
    getRelatedProducts,
    getMyWishlist,
    toggleWishlist,
    getProductReviews,
    getAdminProductRatings,
    createAdminProductRating,
    updateAdminProductRating,
    deleteAdminProductRating,
    getMyProductRating,
    rateProduct,
    createProduct,
    updateProduct,
    deleteProduct,
    deleteAllProducts,
};

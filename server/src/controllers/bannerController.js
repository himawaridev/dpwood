const Banner = require("../models/banner");
const { Op } = require("sequelize");
const { normalizeProductImageUrl } = require("../utils/productImageUrl");
const { normalizeBannerPriceText } = require("../utils/bannerData");

const cleanText = (value, maxLength) => String(value || "").trim().slice(0, maxLength);

const normalizeImageUrl = (value) => {
    const source = String(value || "").trim();
    if (/^\/(?!\/)[^\s]*$/.test(source)) return source;
    return normalizeProductImageUrl(source);
};

const normalizeButtonLink = (value) => {
    const source = String(value || "/products").trim();
    if (/^\/(?!\/)[^\s]*$/.test(source)) return source;

    try {
        const parsed = new URL(source);
        return parsed.protocol === "https:" ? parsed.toString() : "";
    } catch {
        return "";
    }
};

const buildPayload = (body = {}, current = {}, defaultSortOrder = 1) => {
    const sortOrderValue = body.sortOrder ?? current.sortOrder ?? defaultSortOrder;
    const sortOrder = Number.parseInt(sortOrderValue, 10);

    return {
        eyebrow: cleanText(body.eyebrow ?? current.eyebrow, 100) || null,
        title: cleanText(body.title ?? current.title, 180),
        description: cleanText(body.description ?? current.description, 1200) || null,
        imageUrl: normalizeImageUrl(body.imageUrl ?? current.imageUrl),
        priceText: cleanText(normalizeBannerPriceText(body.priceText ?? current.priceText), 80) || null,
        buttonText: cleanText(body.buttonText ?? current.buttonText ?? "XEM SẢN PHẨM", 80),
        buttonLink: normalizeButtonLink(body.buttonLink ?? current.buttonLink ?? "/products"),
        sortOrder: Number.isInteger(sortOrder) ? sortOrder : defaultSortOrder,
        isActive: body.isActive === undefined ? Boolean(current.isActive ?? true) : Boolean(body.isActive),
    };
};

const validatePayload = (payload) => {
    if (!payload.title) return "Tiêu đề banner là bắt buộc";
    if (!payload.imageUrl) return "Ảnh banner phải là URL HTTPS hoặc đường dẫn nội bộ hợp lệ";
    if (!payload.buttonText) return "Nhãn nút banner là bắt buộc";
    if (!payload.buttonLink) return "Liên kết banner không hợp lệ";
    if (!Number.isInteger(payload.sortOrder) || payload.sortOrder < 1) {
        return "Thứ tự banner phải là số nguyên từ 1 trở lên";
    }
    return null;
};

const normalizeExistingSortOrders = async () => {
    const banners = await Banner.findAll({ order: [["sortOrder", "ASC"], ["createdAt", "ASC"]] });
    const usedOrders = new Set();
    let nextOrder = 1;

    for (const banner of banners) {
        const currentOrder = Number(banner.sortOrder);
        if (Number.isInteger(currentOrder) && currentOrder >= 1 && !usedOrders.has(currentOrder)) {
            usedOrders.add(currentOrder);
            while (usedOrders.has(nextOrder)) nextOrder += 1;
            continue;
        }

        while (usedOrders.has(nextOrder)) nextOrder += 1;
        await banner.update({ sortOrder: nextOrder });
        usedOrders.add(nextOrder);
        nextOrder += 1;
    }
};

const ensureSortOrderAvailable = async (sortOrder, excludedId = null) => {
    const where = { sortOrder };
    if (excludedId) where.id = { [Op.ne]: excludedId };
    return !(await Banner.findOne({ where, attributes: ["id"] }));
};

const isSortOrderConstraintError = (error) =>
    error?.name === "SequelizeUniqueConstraintError" || error?.original?.code === "ER_DUP_ENTRY";

const getActiveBanners = async (req, res) => {
    try {
        await normalizeExistingSortOrders();
        const banners = await Banner.findAll({
            where: { isActive: true },
            order: [["sortOrder", "ASC"], ["createdAt", "DESC"]],
        });
        res.status(200).json(banners);
    } catch (error) {
        console.error("getActiveBanners error:", error);
        res.status(500).json({ message: "Không thể tải banner", error: error.message });
    }
};

const getAllBanners = async (req, res) => {
    try {
        await normalizeExistingSortOrders();
        const banners = await Banner.findAll({
            order: [["sortOrder", "ASC"], ["createdAt", "DESC"]],
        });
        res.status(200).json(banners);
    } catch (error) {
        console.error("getAllBanners error:", error);
        res.status(500).json({ message: "Không thể tải danh sách banner", error: error.message });
    }
};

const createBanner = async (req, res) => {
    try {
        await normalizeExistingSortOrders();
        const maxSortOrder = Number(await Banner.max("sortOrder")) || 0;
        const payload = buildPayload(req.body, {}, maxSortOrder + 1);
        const validationError = validatePayload(payload);
        if (validationError) return res.status(400).json({ message: validationError });
        if (!(await ensureSortOrderAvailable(payload.sortOrder))) {
            return res.status(409).json({ message: `Thứ tự ${payload.sortOrder} đã được banner khác sử dụng` });
        }

        const banner = await Banner.create(payload);
        res.status(201).json({ message: "Đã thêm banner", banner });
    } catch (error) {
        console.error("createBanner error:", error);
        if (isSortOrderConstraintError(error)) {
            return res.status(409).json({ message: "Thứ tự này đã được banner khác sử dụng" });
        }
        res.status(500).json({ message: "Không thể thêm banner", error: error.message });
    }
};

const updateBanner = async (req, res) => {
    try {
        await normalizeExistingSortOrders();
        const banner = await Banner.findByPk(req.params.id);
        if (!banner) return res.status(404).json({ message: "Không tìm thấy banner" });

        const payload = buildPayload(req.body, banner.toJSON());
        const validationError = validatePayload(payload);
        if (validationError) return res.status(400).json({ message: validationError });
        if (!(await ensureSortOrderAvailable(payload.sortOrder, banner.id))) {
            return res.status(409).json({ message: `Thứ tự ${payload.sortOrder} đã được banner khác sử dụng` });
        }

        await banner.update(payload);
        res.status(200).json({ message: "Đã cập nhật banner", banner });
    } catch (error) {
        console.error("updateBanner error:", error);
        if (isSortOrderConstraintError(error)) {
            return res.status(409).json({ message: "Thứ tự này đã được banner khác sử dụng" });
        }
        res.status(500).json({ message: "Không thể cập nhật banner", error: error.message });
    }
};

const deleteBanner = async (req, res) => {
    try {
        const banner = await Banner.findByPk(req.params.id);
        if (!banner) return res.status(404).json({ message: "Không tìm thấy banner" });

        await banner.destroy();
        res.status(200).json({ message: "Đã xóa banner" });
    } catch (error) {
        console.error("deleteBanner error:", error);
        res.status(500).json({ message: "Không thể xóa banner", error: error.message });
    }
};

module.exports = {
    getActiveBanners,
    getAllBanners,
    createBanner,
    updateBanner,
    deleteBanner,
};

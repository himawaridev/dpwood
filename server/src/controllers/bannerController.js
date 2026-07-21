const Banner = require("../models/banner");
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

const buildPayload = (body = {}, current = {}) => {
    const sortOrderValue = body.sortOrder ?? current.sortOrder ?? 0;
    const sortOrder = Number.parseInt(sortOrderValue, 10);

    return {
        eyebrow: cleanText(body.eyebrow ?? current.eyebrow, 100) || null,
        title: cleanText(body.title ?? current.title, 180),
        description: cleanText(body.description ?? current.description, 1200) || null,
        imageUrl: normalizeImageUrl(body.imageUrl ?? current.imageUrl),
        priceText: cleanText(normalizeBannerPriceText(body.priceText ?? current.priceText), 80) || null,
        buttonText: cleanText(body.buttonText ?? current.buttonText ?? "XEM SẢN PHẨM", 80),
        buttonLink: normalizeButtonLink(body.buttonLink ?? current.buttonLink ?? "/products"),
        sortOrder: Number.isInteger(sortOrder) ? sortOrder : 0,
        isActive: body.isActive === undefined ? Boolean(current.isActive ?? true) : Boolean(body.isActive),
    };
};

const validatePayload = (payload) => {
    if (!payload.title) return "Tiêu đề banner là bắt buộc";
    if (!payload.imageUrl) return "Ảnh banner phải là URL HTTPS hoặc đường dẫn nội bộ hợp lệ";
    if (!payload.buttonText) return "Nhãn nút banner là bắt buộc";
    if (!payload.buttonLink) return "Liên kết banner không hợp lệ";
    return null;
};

const getActiveBanners = async (req, res) => {
    try {
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
        const payload = buildPayload(req.body);
        const validationError = validatePayload(payload);
        if (validationError) return res.status(400).json({ message: validationError });

        const banner = await Banner.create(payload);
        res.status(201).json({ message: "Đã thêm banner", banner });
    } catch (error) {
        console.error("createBanner error:", error);
        res.status(500).json({ message: "Không thể thêm banner", error: error.message });
    }
};

const updateBanner = async (req, res) => {
    try {
        const banner = await Banner.findByPk(req.params.id);
        if (!banner) return res.status(404).json({ message: "Không tìm thấy banner" });

        const payload = buildPayload(req.body, banner.toJSON());
        const validationError = validatePayload(payload);
        if (validationError) return res.status(400).json({ message: validationError });

        await banner.update(payload);
        res.status(200).json({ message: "Đã cập nhật banner", banner });
    } catch (error) {
        console.error("updateBanner error:", error);
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

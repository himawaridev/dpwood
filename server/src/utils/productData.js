const { randomUUID } = require("crypto");
const { normalizeProductImagePayload, normalizeProductImageUrl } = require("./productImageUrl");

const text = (value, max = 255) => String(value ?? "").trim().slice(0, max);
const nonNegativeNumber = (value, fallback = 0) => {
    const number = Number(value);
    return Number.isFinite(number) && number >= 0 ? number : fallback;
};
const nonNegativeInteger = (value, fallback = 0) => Math.floor(nonNegativeNumber(value, fallback));

const slug = (value) =>
    text(value)
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[đĐ]/g, "d")
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 28);

const createSku = (product = {}) => {
    const prefix = slug(product.category || "DPW").slice(0, 8) || "DPW";
    const name = slug(product.name || "PRODUCT").slice(0, 12) || "PRODUCT";
    return `${prefix}-${name}-${randomUUID().slice(0, 6).toUpperCase()}`;
};

const normalizeVariant = (variant, index, product) => {
    const color = text(variant?.color, 100);
    const size = text(variant?.size || variant?.capacity, 100);
    const baseSku = text(product.sku, 100) || createSku(product);
    return {
        variantId: text(variant?.variantId, 120) || randomUUID(),
        sku: text(variant?.sku, 120) || `${baseSku}-${slug(color || "DEFAULT")}-${slug(size || index + 1)}`.slice(0, 120),
        color,
        size,
        price: nonNegativeNumber(variant?.price, nonNegativeNumber(product.price)),
        stock: nonNegativeInteger(variant?.stock),
        imageUrl: normalizeProductImageUrl(variant?.imageUrl),
    };
};

const normalizeProductPayload = (input = {}, current = {}) => {
    const merged = { ...current, ...input };
    const sku = text(merged.sku, 120) || createSku(merged);
    const rawVariants = Array.isArray(merged.variants) ? merged.variants : [];
    const seenVariantKeys = new Set();
    const variants = rawVariants.reduce((items, variant, index) => {
        const normalized = normalizeVariant(variant, index, { ...merged, sku });
        const key = `${normalized.color.toLowerCase()}::${normalized.size.toLowerCase()}`;
        if (seenVariantKeys.has(key)) return items;
        seenVariantKeys.add(key);
        items.push(normalized);
        return items;
    }, []);
    const imagePayload = normalizeProductImagePayload({
        imageUrl: merged.imageUrl,
        images: merged.images,
        variants,
    });
    const variantImages = variants.map((variant) => variant.imageUrl).filter(Boolean);
    const images = [...new Set([...imagePayload.images, ...variantImages])].slice(0, 12);

    return {
        ...merged,
        name: text(merged.name, 255),
        description: text(merged.description, 20000) || null,
        sku,
        gtin: text(merged.gtin, 32) || null,
        mpn: text(merged.mpn, 100) || null,
        price: nonNegativeNumber(merged.price),
        costPrice: merged.costPrice === null || merged.costPrice === ""
            ? null
            : nonNegativeNumber(merged.costPrice),
        rating: Math.min(5, nonNegativeNumber(merged.rating)),
        ratingCount: nonNegativeInteger(merged.ratingCount),
        stock: variants.length
            ? variants.reduce((sum, variant) => sum + variant.stock, 0)
            : nonNegativeInteger(merged.stock),
        sold: nonNegativeInteger(merged.sold),
        imageUrl: images[0] || "",
        images,
        variants,
        category: text(merged.category, 100) || "cookware",
        material: text(merged.material, 255) || null,
        color: text(merged.color, 100) || null,
        brand: text(merged.brand, 150) || "DPWOOD Kitchen",
        capacity: text(merged.capacity, 100) || null,
        dimensions: text(merged.dimensions, 150) || null,
        weight: text(merged.weight, 100) || null,
        packageWeightGrams: merged.packageWeightGrams === null || merged.packageWeightGrams === ""
            ? null
            : nonNegativeInteger(merged.packageWeightGrams),
        packageLengthCm: merged.packageLengthCm === null || merged.packageLengthCm === ""
            ? null
            : nonNegativeNumber(merged.packageLengthCm),
        packageWidthCm: merged.packageWidthCm === null || merged.packageWidthCm === ""
            ? null
            : nonNegativeNumber(merged.packageWidthCm),
        packageHeightCm: merged.packageHeightCm === null || merged.packageHeightCm === ""
            ? null
            : nonNegativeNumber(merged.packageHeightCm),
        googleProductCategory: text(merged.googleProductCategory, 255) || null,
        seoTitle: text(merged.seoTitle, 180) || null,
        seoDescription: text(merged.seoDescription, 500) || null,
        warranty: text(merged.warranty, 100) || null,
        origin: text(merged.origin, 100) || null,
        packageContents: text(merged.packageContents, 5000) || null,
        careInstructions: text(merged.careInstructions, 5000) || null,
        safetyInstructions: text(merged.safetyInstructions, 5000) || null,
        specifications:
            merged.specifications && typeof merged.specifications === "object" && !Array.isArray(merged.specifications)
                ? merged.specifications
                : {},
        dishwasherSafe: Boolean(merged.dishwasherSafe),
        microwaveSafe: Boolean(merged.microwaveSafe),
        returnEligible: merged.returnEligible !== false,
        returnWindowDays: Math.min(30, Math.max(0, nonNegativeInteger(merged.returnWindowDays, 7))),
    };
};

const validateProductPayload = (product) => {
    const errors = [];
    if (!product.name) errors.push("Tên sản phẩm là bắt buộc.");
    if (!Number.isFinite(Number(product.price)) || Number(product.price) <= 0) errors.push("Giá phải lớn hơn 0.");
    if (!product.category) errors.push("Danh mục là bắt buộc.");
    if (!product.imageUrl) errors.push("Sản phẩm cần ít nhất một ảnh HTTPS hợp lệ.");
    if (product.costPrice !== null && Number(product.costPrice) > Number(product.price)) {
        errors.push("Giá vốn đang cao hơn giá bán. Vui lòng kiểm tra lại.");
    }
    if (product.variants.some((item) => !item.color && !item.size)) {
        errors.push("Mỗi biến thể cần có màu sắc hoặc kích cỡ/dung tích.");
    }
    return errors;
};

module.exports = {
    createSku,
    normalizeProductPayload,
    validateProductPayload,
};

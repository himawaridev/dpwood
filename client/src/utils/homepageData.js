import api from "@/utils/axios";
import { getProductImage } from "@/utils/productImages";

const CLAIMED_COUPONS_KEY = "dpwoodClaimedCouponKeys";

export const formatCompactCurrency = (value) => {
    const numberValue = Number(value || 0);
    if (numberValue >= 1000000) return `${numberValue / 1000000}M`;
    if (numberValue >= 1000) return `${Math.round(numberValue / 1000)}K`;
    return String(numberValue);
};

export const getCouponValue = (coupon) =>
    coupon.discountType === "percent"
        ? `${Number(coupon.discountValue)}%`
        : `${formatCompactCurrency(coupon.discountValue)}đ`;

export const getDaysLeft = (expiryDate) => {
    const diff = new Date(expiryDate).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (24 * 60 * 60 * 1000)));
};

export const getCouponClaimKeys = (coupon) =>
    [coupon?.id, coupon?.code].filter(Boolean).map((value) => String(value));

export const readStoredClaimedCoupons = () => {
    if (typeof window === "undefined") return new Set();
    try {
        const rawValue = localStorage.getItem(CLAIMED_COUPONS_KEY) || "[]";
        return new Set(JSON.parse(rawValue).map(String));
    } catch {
        return new Set();
    }
};

export const writeStoredClaimedCoupons = (keys) => {
    if (typeof window === "undefined") return;
    localStorage.setItem(CLAIMED_COUPONS_KEY, JSON.stringify([...keys]));
};

export const getClaimedKeysFromWallet = (walletItems = []) => {
    const keys = new Set();
    walletItems.forEach((item) => {
        [item.couponId, item.Coupon?.id, item.Coupon?.code]
            .filter(Boolean)
            .forEach((value) => keys.add(String(value)));
    });
    return keys;
};

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const fetchProductsWithWakeRetry = async ({ maxAttempts = 12, retryDelayMs = 5000 } = {}) => {
    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        try {
            const response = await api.get("/products", { timeout: 15000 });
            return [...(response.data || [])].sort(
                (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
            );
        } catch (error) {
            if (attempt === maxAttempts) throw error;
            await wait(retryDelayMs);
        }
    }
    return [];
};

const isUsableCategoryImage = (url = "") =>
    /^https?:\/\//i.test(url) && !url.includes("4kwallpapers.com") && !url.includes("thumbs_2t");

export const buildHomepageCategoryCards = (categories = [], products = []) =>
    categories.map((category) => {
        const categoryProducts = products.filter((product) => product.category === category.value);
        const imageProduct = categoryProducts.find((product) =>
            isUsableCategoryImage(getProductImage(product)),
        );
        const categoryImage = getProductImage(imageProduct);

        return {
            ...category,
            count: categoryProducts.length,
            image: category.imageUrl || categoryImage || "/logo.png",
            fallbackImage:
                categoryImage && categoryImage !== category.imageUrl ? categoryImage : "/logo.png",
            description: category.description || "Khám phá danh mục",
        };
    });

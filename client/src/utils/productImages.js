const PLACEHOLDER_IMAGE_PATTERNS = [
    "/ai/product-image-placeholder",
    "product-image-placeholder?",
    "placehold.co/",
    "loremflickr.com/",
    "picsum.photos/",
];

export const getProductImage = (product) =>
    product?.imageUrl || (Array.isArray(product?.images) ? product.images[0] : null) || null;

export const isGeneratedPlaceholderUrl = (url) => {
    const value = String(url || "").toLowerCase();
    return !value || PLACEHOLDER_IMAGE_PATTERNS.some((pattern) => value.includes(pattern));
};

export const isRealProductImage = (url) =>
    /^https?:\/\//i.test(String(url || "")) && !isGeneratedPlaceholderUrl(url);

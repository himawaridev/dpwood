import { buildKitchenSearchText } from "@/utils/kitchenProduct";

export const normalizeCatalogText = (value = "") =>
    String(value)
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/Đ/g, "D")
        .toLowerCase();

export const formatPriceInput = (value) => {
    if (value === null || value === undefined || value === "") return "";
    return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

export const parsePriceInput = (value = "") => value.replace(/\./g, "").replace(/[^\d]/g, "");

export const filterAndSortProducts = ({
    products,
    query,
    sortBy,
    category,
    color,
    material,
    brand,
    minPrice,
    maxPrice,
    minRating,
    onlyInStock,
    onlyWishlist,
    wishlistIds,
}) => {
    const normalizedQuery = normalizeCatalogText(query.trim());
    const queryTerms = normalizedQuery.split(/\s+/).filter(Boolean);

    return products
        .filter((product) => {
            const searchableText = normalizeCatalogText(buildKitchenSearchText(product));
            const matchesQuery = !queryTerms.length || queryTerms.some((term) => searchableText.includes(term));
            const matchesCategory = category === "all" || product.category === category;
            const matchesColor = color === "all" || product.color === color;
            const matchesMaterial = material === "all" || product.material === material;
            const matchesBrand = brand === "all" || product.brand === brand;
            const price = Number(product.price || 0);
            const matchesPrice = (minPrice === null || price >= minPrice) && (maxPrice === null || price <= maxPrice);
            const matchesRating = Number(product.rating || 0) >= minRating;
            const matchesStock = !onlyInStock || Number(product.stock || 0) > 0;
            const matchesWishlist = !onlyWishlist || wishlistIds.has(String(product.id));
            return (
                matchesQuery &&
                matchesCategory &&
                matchesColor &&
                matchesMaterial &&
                matchesBrand &&
                matchesPrice &&
                matchesRating &&
                matchesStock &&
                matchesWishlist
            );
        })
        .sort((a, b) => {
            if (sortBy === "priceAsc") return Number(a.price || 0) - Number(b.price || 0);
            if (sortBy === "priceDesc") return Number(b.price || 0) - Number(a.price || 0);
            if (sortBy === "sold") return Number(b.sold || 0) - Number(a.sold || 0);
            if (sortBy === "rating") return Number(b.rating || 0) - Number(a.rating || 0);
            return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        });
};

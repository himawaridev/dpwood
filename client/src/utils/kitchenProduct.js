export const KITCHEN_MATERIAL_OPTIONS = [
    "Inox 304",
    "Gang",
    "Nhôm chống dính",
    "Sứ",
    "Thủy tinh",
    "Gỗ tự nhiên",
    "Silicone",
    "Nhựa an toàn thực phẩm",
];

export const KITCHEN_COLOR_OPTIONS = [
    "Đen",
    "Trắng",
    "Bạc",
    "Xám",
    "Kem",
    "Hồng pastel",
    "Xanh mint",
    "Xanh navy",
    "Đỏ đô",
    "Gỗ tự nhiên",
    "Trong suốt",
];

export const getKitchenCategoryLabel = (value) => value || "Đồ bếp";

export const buildKitchenSearchText = (product = {}) =>
    [
        product.name,
        product.description,
        product.categoryLabel || getKitchenCategoryLabel(product.category),
        product.material,
        product.color,
        product.brand,
        product.capacity,
        product.origin,
    ]
        .filter(Boolean)
        .join(" ");

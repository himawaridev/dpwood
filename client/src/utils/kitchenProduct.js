export const KITCHEN_CATEGORY_OPTIONS = [
    { value: "cookware", label: "Nồi & chảo" },
    { value: "tableware", label: "Bàn ăn" },
    { value: "utensils", label: "Dụng cụ bếp" },
    { value: "storage", label: "Lưu trữ thực phẩm" },
    { value: "appliances", label: "Gia dụng nhỏ" },
    { value: "cleaning", label: "Vệ sinh bếp" },
];

export const KITCHEN_CATEGORY_LABELS = KITCHEN_CATEGORY_OPTIONS.reduce((acc, item) => {
    acc[item.value] = item.label;
    return acc;
}, {});

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

export const getKitchenCategoryLabel = (value) => KITCHEN_CATEGORY_LABELS[value] || value || "Đồ bếp";

export const buildKitchenSearchText = (product = {}) =>
    [
        product.name,
        product.description,
        getKitchenCategoryLabel(product.category),
        product.material,
        product.color,
        product.brand,
        product.capacity,
        product.origin,
    ]
        .filter(Boolean)
        .join(" ");

export const ORDER_STATUS_META = {
    PENDING: { label: "Chờ xử lý", optionLabel: "Chờ xử lý", color: "warning" },
    PAID: { label: "Đã thanh toán", optionLabel: "Đã thanh toán", color: "processing" },
    SHIPPING: { label: "Đang giao hàng", optionLabel: "Đang giao", color: "blue" },
    COMPLETED: { label: "Hoàn thành", optionLabel: "Hoàn thành", color: "success" },
    CANCELED: { label: "Đã hủy", optionLabel: "Hủy đơn", color: "error" },
};

export const ORDER_STATUS_OPTIONS = Object.entries(ORDER_STATUS_META).map(([value, meta]) => ({
    value,
    label: meta.optionLabel,
}));

export const getOrderStatusMeta = (status) => {
    const normalizedStatus = String(status || "").toUpperCase();
    return ORDER_STATUS_META[normalizedStatus] || {
        label: normalizedStatus || "Không xác định",
        optionLabel: normalizedStatus || "Không xác định",
        color: "default",
    };
};

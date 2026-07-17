const vndCurrencyFormatter = new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat("vi-VN");

export const formatCurrency = (value) => vndCurrencyFormatter.format(Number(value || 0));

export const formatNumber = (value) => numberFormatter.format(Number(value || 0));

export const formatDate = (value) => {
    if (!value) return "-";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "-" : date.toLocaleDateString("vi-VN");
};

export const formatDateTime = (value) => {
    if (!value) return "-";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "-" : date.toLocaleString("vi-VN");
};

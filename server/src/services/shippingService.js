const FREE_SHIPPING_THRESHOLD = Number(process.env.FREE_SHIPPING_THRESHOLD || 1000000);
const BASE_SHIPPING_FEE = Number(process.env.BASE_SHIPPING_FEE || 30000);
const REMOTE_SHIPPING_FEE = Number(process.env.REMOTE_SHIPPING_FEE || 45000);

const normalize = (value) =>
    String(value || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();

const isCentralArea = (address) => {
    const normalized = normalize(address);
    return normalized.includes("ha noi") || normalized.includes("ho chi minh");
};

const calculateShippingFee = ({ subtotal, address }) => {
    const amount = Number(subtotal || 0);
    if (amount >= FREE_SHIPPING_THRESHOLD) return 0;
    return isCentralArea(address) ? BASE_SHIPPING_FEE : REMOTE_SHIPPING_FEE;
};

module.exports = {
    calculateShippingFee,
    FREE_SHIPPING_THRESHOLD,
    BASE_SHIPPING_FEE,
    REMOTE_SHIPPING_FEE,
};

const normalizeBannerPriceText = (value) => {
    const source = String(value || "").trim();
    if (!source) return "";

    const moneyMatch = source.match(/^([\d.\s]+)(\s*(?:đ|₫|vnd))?$/i);
    if (!moneyMatch) return source;

    const digits = moneyMatch[1].replace(/\D/g, "");
    if (!digits) return source;

    const normalizedNumber = digits.replace(/^0+(?=\d)/, "");
    const formattedNumber = normalizedNumber.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    const rawSuffix = String(moneyMatch[2] || "").trim();
    const suffix = /^vnd$/i.test(rawSuffix) ? " VND" : rawSuffix ? "đ" : "";
    return `${formattedNumber}${suffix}`;
};

module.exports = { normalizeBannerPriceText };

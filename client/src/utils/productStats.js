export const HOT_SOLD_RATIO = 0.4;

export const getProductSalesStats = (product = {}) => {
    const sold = Math.max(0, Number(product.sold || 0));
    const stock = Math.max(0, Number(product.stock || 0));
    const total = sold + stock;
    const soldRatio = total > 0 ? sold / total : 0;
    const soldPercent = Math.round(soldRatio * 100);

    return {
        sold,
        stock,
        total,
        soldRatio,
        soldPercent,
        isHot: total > 0 && soldRatio >= HOT_SOLD_RATIO,
    };
};

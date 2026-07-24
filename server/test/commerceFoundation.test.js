const test = require("node:test");
const assert = require("node:assert/strict");
const {
    calculateShippingFee,
    FREE_SHIPPING_THRESHOLD,
    BASE_SHIPPING_FEE,
    REMOTE_SHIPPING_FEE,
} = require("../src/services/shippingService");
const { recordRequest, snapshot } = require("../src/services/requestMetricsService");
const { getVariantStock } = require("../src/services/inventoryService");
const { normalizeProductPayload, validateProductPayload } = require("../src/utils/productData");

test("miễn phí vận chuyển khi đơn đạt ngưỡng", () => {
    assert.equal(calculateShippingFee({
        subtotal: FREE_SHIPPING_THRESHOLD,
        address: "128 Hàng Trống, Hoàn Kiếm, Hà Nội",
    }), 0);
});

test("tính phí giao hàng theo khu vực", () => {
    assert.equal(calculateShippingFee({
        subtotal: FREE_SHIPPING_THRESHOLD - 1,
        address: "Hoàn Kiếm, Hà Nội",
    }), BASE_SHIPPING_FEE);
    assert.equal(calculateShippingFee({
        subtotal: 100000,
        address: "Thành phố Huế",
    }), REMOTE_SHIPPING_FEE);
});

test("chuẩn hóa dữ liệu thương mại và cảnh báo giá vốn cao hơn giá bán", () => {
    const product = normalizeProductPayload({
        name: "Nồi inox 304",
        category: "cookware",
        price: 500000,
        costPrice: 600000,
        imageUrl: "https://example.com/pot.jpg",
        packageWeightGrams: 1500,
        seoTitle: "Nồi inox 304 DPWOOD",
    });
    assert.equal(product.packageWeightGrams, 1500);
    assert.equal(product.costPrice, 600000);
    assert.ok(validateProductPayload(product).some((message) => message.includes("Giá vốn")));
});

test("sổ tồn kho lấy đúng tồn tổng và tồn theo biến thể", () => {
    const product = {
        stock: 12,
        variants: [
            { variantId: "white-12", stock: 7 },
            { variantId: "black-12", stock: 5 },
        ],
    };
    assert.equal(getVariantStock(product), 12);
    assert.equal(getVariantStock(product, "white-12"), 7);
    assert.equal(getVariantStock(product, "missing"), 0);
});

test("metrics tính tỷ lệ lỗi và percentile", () => {
    recordRequest({ method: "GET", path: "/api/products/123", statusCode: 200, durationMs: 20 });
    recordRequest({ method: "GET", path: "/api/products/456", statusCode: 500, durationMs: 1200 });
    const metrics = snapshot();
    assert.ok(metrics.requests >= 2);
    assert.ok(metrics.serverErrors >= 1);
    assert.ok(metrics.p95Ms >= 20);
    assert.ok(metrics.slowRequests.length >= 1);
});

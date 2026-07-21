const test = require("node:test");
const assert = require("node:assert/strict");
const { normalizeBannerPriceText } = require("../src/utils/bannerData");

test("formats banner prices with Vietnamese thousand separators", () => {
    assert.equal(normalizeBannerPriceText("500000"), "500.000");
    assert.equal(normalizeBannerPriceText("1250000đ"), "1.250.000đ");
    assert.equal(normalizeBannerPriceText("1.250.000 VND"), "1.250.000 VND");
});

test("preserves promotional banner text", () => {
    assert.equal(normalizeBannerPriceText("Giảm đến 20%"), "Giảm đến 20%");
});

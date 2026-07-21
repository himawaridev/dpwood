const test = require("node:test");
const assert = require("node:assert/strict");

const {
  normalizeProductPayload,
  validateProductPayload,
} = require("../src/utils/productData");

test("normalizes product images and independent variants", () => {
  const product = normalizeProductPayload({
    name: "  Bo noi bep  ",
    category: "cookware",
    price: "450000",
    imageUrl: "http://images.example.com/pot.jpg",
    images: [
      "https://images.example.com/pot.jpg",
      "https://images.example.com/pot-detail.jpg",
      "https://images.example.com/pot-detail.jpg",
    ],
    variants: [
      { color: "Trang", size: "20 cm", price: "450000", stock: "12" },
      { color: "Trang", size: "24 cm", price: "520000", stock: "8" },
      { color: "Trang", size: "20 cm", price: "450000", stock: "99" },
    ],
  });

  assert.equal(product.name, "Bo noi bep");
  assert.equal(product.price, 450000);
  assert.equal(product.imageUrl, "https://images.example.com/pot.jpg");
  assert.deepEqual(product.images, [
    "https://images.example.com/pot.jpg",
    "https://images.example.com/pot-detail.jpg",
  ]);
  assert.equal(product.variants.length, 2);
  assert.equal(product.stock, 20);
  assert.ok(product.sku);
  assert.ok(product.variants.every((variant) => variant.variantId && variant.sku));
});

test("rejects products without a usable image", () => {
  const product = normalizeProductPayload({
    name: "Chao inox",
    category: "cookware",
    price: 320000,
    imageUrl: "data:image/png;base64,not-allowed",
  });

  const errors = validateProductPayload(product);
  assert.ok(errors.includes("Sản phẩm cần ít nhất một ảnh HTTPS hợp lệ."));
});

test("allows half-star compatible numeric product ratings", () => {
  const product = normalizeProductPayload({
    name: "Thot go",
    category: "utensils",
    price: 180000,
    imageUrl: "https://images.example.com/board.jpg",
    rating: "4.5",
    ratingCount: "16",
  });

  assert.equal(product.rating, 4.5);
  assert.equal(product.ratingCount, 16);
  assert.deepEqual(validateProductPayload(product), []);
});

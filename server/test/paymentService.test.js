const test = require("node:test");
const assert = require("node:assert/strict");
const { PaymentService } = require("../src/services/paymentService");
const { _test: orderHelpers } = require("../src/controllers/orderController");

test("PayOS v1 tạo link bằng createPaymentLink", async () => {
    const service = new PaymentService();
    const payload = { orderCode: 123, amount: 2000 };
    service.client = { createPaymentLink: async (value) => ({ ...value, checkoutUrl: "https://payos.test" }) };
    const result = await service.createPaymentLink(payload);
    assert.equal(result.orderCode, 123);
    assert.equal(result.checkoutUrl, "https://payos.test");
});

test("PayOS v2 tạo link bằng paymentRequests.create", async () => {
    const service = new PaymentService();
    service.client = { paymentRequests: { create: async (value) => ({ data: value }) } };
    const result = await service.createPaymentLink({ orderCode: 456, amount: 5000 });
    assert.equal(result.data.orderCode, 456);
});

test("hủy link hỗ trợ SDK PayOS v2", async () => {
    const service = new PaymentService();
    let calledWith;
    service.client = { paymentRequests: { cancel: async (...args) => { calledWith = args; return true; } } };
    await service.cancelPaymentLink("789", "Khách hàng hủy");
    assert.deepEqual(calledWith, [789, "Khách hàng hủy"]);
});

test("QR hết hạn đúng sau 10 phút", () => {
    const createdAt = new Date("2026-07-20T00:00:00.000Z");
    const order = { paymentMethod: "QR", createdAt };
    const expiry = orderHelpers.getQrPaymentExpiry(order);
    assert.equal(expiry.getTime() - createdAt.getTime(), 10 * 60 * 1000);
    assert.equal(orderHelpers.isQrPaymentExpired(order, createdAt.getTime() + 9 * 60 * 1000), false);
    assert.equal(orderHelpers.isQrPaymentExpired(order, createdAt.getTime() + 10 * 60 * 1000), true);
});

test("dữ liệu QR không làm lộ cấu hình bí mật", () => {
    const order = { orderCode: 123, totalAmount: 99000, paymentMethod: "QR", createdAt: new Date() };
    const result = orderHelpers.serializePayosData({ status: "PENDING", qrCode: "qr-data" }, order);
    assert.equal(result.amount, 99000);
    assert.equal(result.status, "PENDING");
    assert.equal(Object.hasOwn(result, "checksumKey"), false);
});

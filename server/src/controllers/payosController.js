const PayOS = require("@payos/node");

// Thông tin này bạn lấy từ trang quản trị của PayOS (payos.vn)
const payos = new PayOS("YOUR_CLIENT_ID", "YOUR_API_KEY", "YOUR_CHECKSUM_KEY");

// Tại hàm tạo đơn hàng (checkout), thay vì chỉ trả về orderCode, ta sẽ tạo link thanh toán
const createPayment = async (order, items) => {
    const paymentBody = {
        orderCode: Number(order.orderCode), // Phải là số
        amount: order.totalAmount,
        description: `DPWOOD ${order.orderCode}`,
        items: items.map((i) => ({ name: i.name, quantity: i.quantity, price: i.price })),
        returnUrl: `http://localhost:3000/profile`, // Trang quay lại khi thành công
        cancelUrl: `http://localhost:3000/cart`, // Trang quay lại khi hủy
    };

    const paymentLinkData = await payos.createPaymentLink(paymentBody);
    return paymentLinkData;
};

const handlePayOSWebhook = async (req, res) => {
    try {
        const webhookData = payos.verifyPaymentWebhookData(req.body);

        // Kiểm tra nội dung giao dịch thành công
        if (req.body.code === "00") {
            const orderCode = webhookData.orderCode;

            // Tìm đơn hàng và cập nhật PAID
            const order = await Order.findOne({ where: { orderCode: orderCode } });
            if (order && order.status !== "PAID") {
                order.status = "PAID";
                await order.save();

                // Cập nhật số lượng đã bán (sold) như đã làm ở các bước trước
                // ... logic update sold ...
            }
        }
        return res.json({ success: true });
    } catch (error) {
        return res.status(400).json({ message: "Webhook signature invalid" });
    }
};

const { sequelize } = require("../config/connectSequelize");
const Product = require("../models/product");
const Order = require("../models/order");
const OrderItem = require("../models/orderItem");
const AuditLog = require("../models/auditLog");

// --- 1. HÀM TẠO ĐƠN HÀNG ---
const checkout = async (req, res) => {
    const t = await sequelize.transaction();

    try {
        const { items, paymentMethod, shippingInfo } = req.body;
        const userId = req.user.id;

        if (!items || items.length === 0) {
            return res.status(400).json({ message: "Giỏ hàng trống" });
        }

        let totalAmount = 0;
        const orderItemsData = [];

        // 1. Kiểm tra tồn kho & trừ tồn kho
        for (const item of items) {
            const product = await Product.findByPk(item.productId, {
                transaction: t,
                lock: t.LOCK.UPDATE,
            });
            if (!product) throw new Error(`Sản phẩm không tồn tại`);
            if (product.stock < item.quantity)
                throw new Error(`"${product.name}" chỉ còn ${product.stock} kiện.`);

            totalAmount += product.price * item.quantity;
            product.stock -= item.quantity;
            await product.save({ transaction: t });

            orderItemsData.push({
                productId: product.id,
                quantity: item.quantity,
                priceAtPurchase: product.price,
            });
        }

        // 2. Tạo mã đơn hàng ngẫu nhiên 6 số (VD: 847291)
        const orderCode = Math.floor(100000 + Math.random() * 900000).toString();

        // 3. Tạo Đơn hàng
        const order = await Order.create(
            {
                userId,
                orderCode,
                totalAmount,
                paymentMethod: paymentMethod || "COD",
                status: "PENDING",
                // Lưu thông tin giao hàng vào đơn
                shippingName: shippingInfo?.recipientName,
                shippingPhone: shippingInfo?.phoneNumber,
                shippingAddress: shippingInfo?.fullAddress,
            },
            { transaction: t },
        );

        const orderItemsWithOrderId = orderItemsData.map((item) => ({
            ...item,
            orderId: order.id,
        }));
        await OrderItem.bulkCreate(orderItemsWithOrderId, { transaction: t });

        // 4. Ghi Log đặt hàng
        await AuditLog.create(
            {
                userId,
                action: "ORDER_CREATED",
                details: `Tạo đơn hàng #${orderCode} - Phương thức: ${paymentMethod} - Tổng: ${new Intl.NumberFormat("vi-VN").format(totalAmount)}đ`,
            },
            { transaction: t },
        );

        await t.commit();
        res.status(200).json({
            message: "Đặt hàng thành công!",
            orderId: order.id,
            orderCode: order.orderCode,
        });
    } catch (error) {
        await t.rollback();
        res.status(400).json({ message: error.message });
    }
};

// --- 2. HÀM ĐÓN TÍN HIỆU TỪ NGÂN HÀNG (WEBHOOK) ---
// Giả định bạn dùng dịch vụ như SePay hoặc PayOS, khi có tiền vào, họ sẽ tự động gọi API này của bạn
const handleWebhook = async (req, res) => {
    // Luôn trả về 200 OK ngay lập tức để đối tác (Ngân hàng) biết bạn đã nhận tin, tránh việc họ gửi lại liên tục
    res.status(200).json({ success: true });

    try {
        // Dữ liệu ngân hàng/đối tác gửi về (Tùy theo đối tác mà key sẽ khác nhau, đây là ví dụ chuẩn chung)
        const { amount, content, transactionId } = req.body;

        // 1. Dùng Regex để tìm chữ DPWOOD + 6 số (VD trong chuỗi: "NGUYEN VAN A CHUYEN TIEN DPWOOD123456")
        const match = content.match(/DPWOOD(\d{6})/i);

        if (!match) return; // Không có cú pháp này, coi như chuyển khoản cá nhân bình thường, bỏ qua.

        const orderCode = match[1]; // Lấy được 6 số: "123456"

        // 2. Tìm đơn hàng trong Database
        const order = await Order.findOne({ where: { orderCode, status: "PENDING" } });
        if (!order) return;

        // 3. Kiểm tra xem số tiền khách chuyển có đủ không (chấp nhận chuyển dư, không chấp nhận chuyển thiếu)
        if (Number(amount) >= Number(order.totalAmount)) {
            // Cập nhật trạng thái thành Đã Thanh Toán
            order.status = "PAID";
            await order.save();

            // Ghi Log hệ thống tự động xác nhận
            await AuditLog.create({
                userId: order.userId,
                action: "PAYMENT_RECEIVED",
                details: `Hệ thống tự động xác nhận đã nhận ${new Intl.NumberFormat("vi-VN").format(amount)}đ cho đơn hàng #${orderCode}. Mã GD: ${transactionId}`,
            });

            console.log(`✅ [WEBHOOK] Đã tự động xác nhận thanh toán cho đơn hàng ${orderCode}`);
        } else {
            console.log(
                `❌ [WEBHOOK] Đơn hàng ${orderCode} chuyển thiếu tiền (${amount} / ${order.totalAmount})`,
            );
            // Ở dự án thực tế, chỗ này sẽ lưu trạng thái 'PARTIAL_PAID' hoặc gửi email nhắc khách
        }
    } catch (error) {
        console.error("Lỗi khi xử lý Webhook:", error);
    }
};

// --- 3. KIỂM TRA TRẠNG THÁI ĐƠN HÀNG ---
const getOrderStatus = async (req, res) => {
    try {
        const { orderCode } = req.params;
        const order = await Order.findOne({ where: { orderCode } });
        if (!order) return res.status(404).json({ message: "Không tìm thấy đơn hàng" });

        res.json({ status: order.status });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// --- 4. HỦY ĐƠN HÀNG VÀ HOÀN LẠI TỒN KHO ---
const cancelOrder = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { orderCode } = req.params;
        const order = await Order.findOne({
            where: { orderCode, status: "PENDING" },
            transaction: t,
        });

        if (!order) throw new Error("Không thể hủy đơn hàng này");

        // Tìm các món hàng trong đơn và cộng lại tồn kho
        const items = await OrderItem.findAll({ where: { orderId: order.id }, transaction: t });
        for (const item of items) {
            const product = await Product.findByPk(item.productId, {
                transaction: t,
                lock: t.LOCK.UPDATE,
            });
            if (product) {
                product.stock += item.quantity;
                await product.save({ transaction: t });
            }
        }

        // Cập nhật trạng thái thành CANCELED
        order.status = "CANCELED";
        await order.save({ transaction: t });

        // Ghi Log
        await AuditLog.create(
            {
                userId: req.user.id,
                action: "ORDER_CANCELED",
                details: `Khách hàng hủy thanh toán đơn #${orderCode}, đã hoàn lại tồn kho.`,
            },
            { transaction: t },
        );

        await t.commit();
        res.json({ message: "Đã hủy giao dịch" });
    } catch (error) {
        await t.rollback();
        res.status(400).json({ message: error.message });
    }
};

module.exports = { checkout, handleWebhook, getOrderStatus, cancelOrder };

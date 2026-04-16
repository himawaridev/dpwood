const { sequelize } = require("../config/connectSequelize");
const Product = require("../models/product");
const Order = require("../models/order");
const OrderItem = require("../models/orderItem");
const AuditLog = require("../models/auditLog");
const User = require("../models/user");
const sendEmail = require("../utils/sendEmail");

const PayOSModule = require("@payos/node");
const PayOS = PayOSModule.PayOS || PayOSModule.default || PayOSModule;

const CLIENT_ID = (process.env.PAYOS_CLIENT_ID || "").trim();
const API_KEY = (process.env.PAYOS_API_KEY || "").trim();
const CHECKSUM_KEY = (process.env.PAYOS_CHECKSUM_KEY || "").trim();

const payos = new PayOS({
    clientId: CLIENT_ID,
    apiKey: API_KEY,
    checksumKey: CHECKSUM_KEY,
});

const generateOrderHtml = (orderInfo, orderItems, isPaid) => {
    const itemsHtml = orderItems
        .map(
            (item) => `
        <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name}</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right; color: #cf1322;">
                ${new Intl.NumberFormat("vi-VN").format(item.price * item.quantity)}₫
            </td>
        </tr>
    `,
        )
        .join("");

    const statusBadge = isPaid
        ? `<span style="background: #52c41a; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">ĐÃ THANH TOÁN (QR)</span>`
        : `<span style="background: #1677ff; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">CHỜ THANH TOÁN KHI NHẬN HÀNG (COD)</span>`;

    return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
            <div style="background-color: #001529; color: white; padding: 20px; text-align: center;">
                <h1 style="margin: 0;">DPWOOD</h1>
                <p style="margin: 5px 0 0 0; color: #aaa;">Xác nhận đơn hàng #${orderInfo.orderCode}</p>
            </div>
            <div style="padding: 20px;">
                <p>Xin chào <strong>${orderInfo.customerName}</strong>,</p>
                <p>Cảm ơn bạn đã mua sắm tại DPWOOD. Đơn hàng của bạn đã được ghi nhận thành công!</p>
                <div style="background-color: #f9f9f9; padding: 15px; border-radius: 6px; margin: 20px 0;">
                    <p style="margin: 5px 0;"><strong>Người nhận:</strong> ${orderInfo.shippingName} - ${orderInfo.shippingPhone}</p>
                    <p style="margin: 5px 0;"><strong>Địa chỉ:</strong> ${orderInfo.shippingAddress}</p>
                    <p style="margin: 5px 0;"><strong>Trạng thái:</strong> ${statusBadge}</p>
                </div>
                <table style="width: 100%; border-collapse: collapse;">
                    <thead><tr style="background-color: #fafafa;"><th style="text-align: left;">Sản phẩm</th><th>SL</th><th style="text-align: right;">Thành tiền</th></tr></thead>
                    <tbody>${itemsHtml}</tbody>
                    <tfoot><tr><td colspan="2" style="text-align: right; font-weight: bold;">Tổng thanh toán:</td><td style="text-align: right; font-weight: bold; font-size: 18px; color: #cf1322;">${new Intl.NumberFormat("vi-VN").format(orderInfo.totalAmount)}₫</td></tr></tfoot>
                </table>
            </div>
        </div>
    `;
};

const checkout = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { items, paymentMethod, shippingInfo } = req.body;
        const userId = req.user.id;
        const userEmail = req.user.email;

        if (!items || items.length === 0) throw new Error("Giỏ hàng trống");

        let totalAmount = 0;
        const orderItemsData = [];
        const emailItemsInfo = [];

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
            emailItemsInfo.push({
                name: product.name,
                quantity: item.quantity,
                price: product.price,
            });
        }

        if (paymentMethod === "QR" && totalAmount < 2000) {
            throw new Error(
                "PayOS yêu cầu giá trị đơn hàng phải từ 2,000 VNĐ trở lên để tạo mã QR. Vui lòng thêm sản phẩm!",
            );
        }

        const orderCodeNum = Math.floor(100000 + Math.random() * 900000);
        const orderCode = String(orderCodeNum);

        const order = await Order.create(
            {
                userId,
                orderCode,
                totalAmount,
                paymentMethod: paymentMethod || "COD",
                status: "PENDING",
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

        await AuditLog.create(
            {
                userId,
                action: "ORDER_CREATED",
                details: `Tạo đơn hàng #${orderCode} - Tổng: ${new Intl.NumberFormat("vi-VN").format(totalAmount)}đ`,
            },
            { transaction: t },
        );

        let paymentLinkData = null;

        if (paymentMethod === "QR") {
            const domain = process.env.FRONTEND_URL || "http://localhost:3000";
            const body = {
                orderCode: Number(orderCodeNum),
                amount: totalAmount,
                description: `DPWOOD${orderCodeNum}`,
                items: emailItemsInfo.map((i) => ({
                    name: String(i.name).substring(0, 50),
                    quantity: i.quantity,
                    price: Number(i.price),
                })),
                returnUrl: `${domain}/profile?status=PAID`,
                cancelUrl: `${domain}/cart?cancel=true`,
            };

            paymentLinkData = await payos.paymentRequests.create(body);
        }

        await t.commit();

        if (paymentMethod === "COD") {
            const orderInfo = {
                orderCode: order.orderCode,
                customerName: req.user.name || "Quý khách",
                shippingName: order.shippingName,
                shippingPhone: order.shippingPhone,
                shippingAddress: order.shippingAddress,
                totalAmount: order.totalAmount,
            };
            sendEmail(
                userEmail,
                `[DPWOOD] Xác nhận đặt hàng #${orderCode}`,
                generateOrderHtml(orderInfo, emailItemsInfo, false),
            );
        }

        res.status(200).json({
            message: "Thành công!",
            orderId: order.id,
            orderCode: order.orderCode,
            paymentLink: paymentLinkData,
        });
    } catch (error) {
        await t.rollback();
        res.status(400).json({ message: error.message });
    }
};

const handleWebhook = async (req, res) => {
    try {
        const webhookData = req.body.data;
        if (!webhookData || !webhookData.orderCode) return res.json({ success: true });

        const orderCode = String(webhookData.orderCode);
        const order = await Order.findOne({
            where: { orderCode, status: "PENDING" },
            include: [{ model: User, attributes: ["email", "name"] }],
        });

        if (!order) return res.json({ success: true });

        order.status = "PAID";
        await order.save();

        const items = await OrderItem.findAll({ where: { orderId: order.id } });
        for (const item of items) {
            const product = await Product.findByPk(item.productId);
            if (product) {
                product.sold += item.quantity;
                await product.save();
            }
        }

        const transactionCode =
            webhookData.transactionReference || webhookData.reference || "Giao dịch Online";
        await AuditLog.create({
            userId: order.userId,
            action: "PAYMENT_RECEIVED",
            details: `PayOS tự động xác nhận ${new Intl.NumberFormat("vi-VN").format(webhookData.amount)}đ cho đơn #${orderCode}. Mã GD: ${transactionCode}`,
        });

        if (order.User && order.User.email) {
            const emailItemsInfo = items.map((i) => ({
                name: "Sản phẩm",
                quantity: i.quantity,
                price: i.priceAtPurchase,
            }));
            const orderInfo = {
                orderCode: order.orderCode,
                customerName: order.User.name,
                shippingName: order.shippingName,
                shippingPhone: order.shippingPhone,
                shippingAddress: order.shippingAddress,
                totalAmount: order.totalAmount,
            };
            sendEmail(
                order.User.email,
                `[DPWOOD] Đã thanh toán đơn #${orderCode}`,
                generateOrderHtml(orderInfo, emailItemsInfo, true),
            );
        }
        return res.json({ success: true });
    } catch (error) {
        return res.json({ success: false });
    }
};

const getOrderStatus = async (req, res) => {
    try {
        const { orderCode } = req.params;
        const order = await Order.findOne({ where: { orderCode } });
        if (!order) return res.status(404).json({ message: "Không tìm thấy" });
        res.json({ status: order.status });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const cancelOrder = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { orderCode } = req.params;
        const order = await Order.findOne({
            where: { orderCode, status: "PENDING" },
            transaction: t,
        });
        if (!order) throw new Error("Không thể hủy");

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
        order.status = "CANCELED";
        await order.save({ transaction: t });

        await AuditLog.create(
            {
                userId: req.user.id,
                action: "ORDER_CANCELED",
                details: `Hủy đơn #${orderCode}, đã hoàn tồn kho.`,
            },
            { transaction: t },
        );

        await t.commit();
        res.json({ message: "Đã hủy" });
    } catch (error) {
        await t.rollback();
        res.status(400).json({ message: error.message });
    }
};

// 🔴 ĐÃ BỔ SUNG: Include OrderItem và Product vào dữ liệu lấy ra
const getAllOrdersAdmin = async (req, res) => {
    try {
        const orders = await Order.findAll({
            order: [["createdAt", "DESC"]],
            include: [
                { model: User, attributes: ["name", "email"] },
                { model: OrderItem, include: [{ model: Product }] }, // Lấy chi tiết sản phẩm và Hình ảnh
            ],
        });
        res.status(200).json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateOrderStatusAdmin = async (req, res) => {
    try {
        const order = await Order.findByPk(req.params.id);
        if (!order) return res.status(404).json({ message: "Không tìm thấy" });
        order.status = req.body.status;
        await order.save();
        res.status(200).json({ message: "Cập nhật thành công", order });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 🔴 ĐÃ BỔ SUNG: Cho trang Profile User cũng xem được chi tiết và Hình ảnh nếu cần
const getMyOrders = async (req, res) => {
    try {
        const orders = await Order.findAll({
            where: { userId: req.user.id },
            order: [["createdAt", "DESC"]],
            include: [{ model: OrderItem, include: [{ model: Product }] }],
        });
        res.status(200).json(orders);
    } catch (error) {
        console.error("🔥 LỖI CẬP NHẬT TRẠNG THÁI ĐƠN HÀNG:", error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    checkout,
    handleWebhook,
    getOrderStatus,
    cancelOrder,
    getAllOrdersAdmin,
    updateOrderStatusAdmin,
    getMyOrders,
};

const { sequelize } = require("../config/connectSequelize");
const Product = require("../models/product");
const Order = require("../models/order");
const OrderItem = require("../models/orderItem");
const AuditLog = require("../models/auditLog");
const User = require("../models/user");
const Coupon = require("../models/coupon");
const UserCoupon = require("../models/userCoupon");
const sendEmail = require("../utils/sendEmail");
const paymentService = require("../services/paymentService");
const orderService = require("../services/orderService");
const { generateOrderHtml } = require("../templates/emailTemplates");

const checkout = async (req, res) => {
    try {
        const { order, paymentLinkData } = await orderService.processCheckout(req.user, req.body);
        res.status(200).json({
            message: "Thành công!",
            orderId: order.id,
            orderCode: order.orderCode,
            paymentLink: paymentLinkData,
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const handleWebhook = async (req, res) => {
    try {
        const webhookData = paymentService.verifyPaymentWebhookData(req.body);
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
        const order = await Order.findOne({ 
            where: { orderCode },
            include: [{ model: User, attributes: ["email", "name"] }],
        });
        
        if (!order) return res.status(404).json({ message: "Không tìm thấy" });

        // Tự động kiểm tra trạng thái trên PayOS nếu đang PENDING 
        // (đặc biệt hữu ích khi Dev ở localhost không nhận được webhook)
        if (order.paymentMethod === "QR" && order.status === "PENDING") {
            try {
                const paymentInfo = await paymentService.getPaymentLinkInfo(Number(orderCode));
                const paymentStatus = paymentInfo?.status || paymentInfo?.data?.status;
                if (paymentStatus === "PAID") {
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

                    await AuditLog.create({
                        userId: order.userId,
                        action: "PAYMENT_RECEIVED",
                        details: `Hệ thống tự đồng bộ trạng thái PAID từ PayOS. Đơn #${orderCode}.`,
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
                }
            } catch (payosError) {
                console.error("Lỗi đồng bộ PayOS:", payosError.message);
            }
        }

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
    const t = await sequelize.transaction();
    try {
        const { status: newStatus } = req.body;
        const validStatuses = ["PENDING", "PAID", "SHIPPING", "COMPLETED", "CANCELED"];
        if (!validStatuses.includes(newStatus)) {
            return res.status(400).json({ message: "Trạng thái không hợp lệ" });
        }

        const order = await Order.findByPk(req.params.id, { transaction: t });
        if (!order) return res.status(404).json({ message: "Không tìm thấy" });

        const oldStatus = order.status;
        if (oldStatus === newStatus) {
            await t.rollback();
            return res.status(200).json({ message: "Trạng thái không thay đổi", order });
        }

        // Nếu khôi phục từ CANCELED → trừ lại tồn kho (vì khi hủy đã hoàn kho)
        if (oldStatus === "CANCELED" && newStatus !== "CANCELED") {
            const items = await OrderItem.findAll({ where: { orderId: order.id }, transaction: t });
            for (const item of items) {
                const product = await Product.findByPk(item.productId, {
                    transaction: t,
                    lock: t.LOCK.UPDATE,
                });
                if (product) {
                    if (product.stock < item.quantity) {
                        await t.rollback();
                        return res.status(400).json({
                            message: `Không đủ tồn kho cho sản phẩm "${product.name}" (còn ${product.stock}, cần ${item.quantity})`,
                        });
                    }
                    product.stock -= item.quantity;
                    await product.save({ transaction: t });
                }
            }
        }

        // Nếu chuyển sang CANCELED → hoàn tồn kho
        if (newStatus === "CANCELED" && oldStatus !== "CANCELED") {
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
        }

        order.status = newStatus;
        await order.save({ transaction: t });

        await AuditLog.create(
            {
                userId: req.user.id,
                action: "ORDER_STATUS_CHANGED",
                details: `Admin đổi trạng thái đơn #${order.orderCode}: ${oldStatus} → ${newStatus}`,
            },
            { transaction: t },
        );

        await t.commit();
        res.status(200).json({ message: "Cập nhật thành công", order });
    } catch (error) {
        await t.rollback();
        console.error("🔥 LỖI CẬP NHẬT TRẠNG THÁI ĐƠN HÀNG:", error);
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

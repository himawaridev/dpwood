const { sequelize } = require("../config/connectSequelize");
const { Op } = require("sequelize");
const Product = require("../models/product");
const Order = require("../models/order");
const OrderItem = require("../models/orderItem");
const AuditLog = require("../models/auditLog");
const User = require("../models/user");
const Coupon = require("../models/coupon");
const UserCoupon = require("../models/userCoupon");
const { syncLegacyDiscountsToCoupons } = require("../services/couponSyncService");
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
    // 1. Khởi tạo Transaction để đảm bảo tính toàn vẹn dữ liệu (Nếu lỗi ở bất kỳ bước nào, Database sẽ quay xe - Rollback)
    const t = await sequelize.transaction();
    try {
        const { items, paymentMethod, shippingInfo, discountCode } = req.body;
        const userId = req.user.id;

        if (!items || items.length === 0) {
            return res.status(400).json({ message: "Giỏ hàng không được để trống" });
        }

        let subTotal = 0;
        const orderItemsData = [];

        // 2. DUYỆT GIỎ HÀNG VÀ TÍNH TOÁN GIÁ TRỊ THỰC TẾ TỪ DATABASE
        for (const item of items) {
            const product = await Product.findByPk(item.productId, { transaction: t });

            if (!product) {
                throw new Error(`Sản phẩm với ID ${item.productId} không tồn tại`);
            }
            if (product.stock < item.quantity) {
                throw new Error(
                    `Sản phẩm ${product.name} chỉ còn ${product.stock} sản phẩm trong kho`,
                );
            }

            // Tính tiền hàng dựa trên giá thực tế trong Database (Chống hack F12)
            const itemPrice = parseFloat(product.price);
            subTotal += itemPrice * item.quantity;

            // Chuẩn bị dữ liệu để lưu vào bảng OrderItem sau này
            orderItemsData.push({
                productId: product.id,
                quantity: item.quantity,
                priceAtPurchase: itemPrice, // Lưu giá lúc mua để sau này Admin đổi giá không làm sai lịch sử
                name: product.name, // Dùng để gửi mail hoặc tạo đơn PayOS
            });

            // Cập nhật tồn kho và số lượng đã bán
            product.stock -= item.quantity;
            product.sold += item.quantity;
            await product.save({ transaction: t });
        }

        // 3. XỬ LÝ MÃ GIẢM GIÁ (BẢO MẬT TRÊN SERVER)
        let discountAmount = 0;
        let finalAppliedCode = null;

        if (discountCode) {
            const now = new Date();
            await syncLegacyDiscountsToCoupons({ code: discountCode, transaction: t });
            const coupon = await Coupon.findOne({
                where: {
                    code: String(discountCode).trim().toUpperCase(),
                    isActive: true,
                    startDate: { [Op.lte]: now },
                    expiryDate: { [Op.gt]: now },
                },
                transaction: t,
            });

            if (!coupon) {
                const error = new Error("Mã giảm giá không tồn tại hoặc đã hết hạn.");
                error.status = 400;
                throw error;
            }

            if (coupon.usageLimit && Number(coupon.usedCount || 0) >= Number(coupon.usageLimit)) {
                const error = new Error("Mã giảm giá đã hết lượt sử dụng.");
                error.status = 400;
                throw error;
            }

            const userCoupon = await UserCoupon.findOne({
                where: { userId, couponId: coupon.id },
                transaction: t,
                lock: true,
            });

            if (!userCoupon) {
                const error = new Error("Bạn chưa lưu mã giảm giá này.");
                error.status = 400;
                throw error;
            }

            if (userCoupon.isUsed) {
                const error = new Error("Bạn đã sử dụng mã này rồi.");
                error.status = 400;
                throw error;
            }

            if (subTotal < Number(coupon.minOrderAmount || 0)) {
                const error = new Error(
                    `Đơn hàng tối thiểu ${new Intl.NumberFormat("vi-VN").format(
                        coupon.minOrderAmount,
                    )}đ để áp dụng mã này.`,
                );
                error.status = 400;
                throw error;
            }

            if (coupon.discountType === "percent") {
                discountAmount = Math.floor((subTotal * Number(coupon.discountValue || 0)) / 100);
                if (
                    coupon.maxDiscountAmount &&
                    discountAmount > Number(coupon.maxDiscountAmount || 0)
                ) {
                    discountAmount = Number(coupon.maxDiscountAmount);
                }
            } else {
                discountAmount = Number(coupon.discountValue || 0);
            }

            discountAmount = Math.min(discountAmount, subTotal);
            finalAppliedCode = coupon.code;

            userCoupon.isUsed = true;
            userCoupon.usedAt = new Date();
            await userCoupon.save({ transaction: t });

            coupon.usedCount = Number(coupon.usedCount || 0) + 1;
            await coupon.save({ transaction: t });
        }

        const finalTotalAmount = subTotal - discountAmount;

        // Kiểm tra điều kiện PayOS (Tối thiểu 2,000đ)
        if (paymentMethod === "QR" && finalTotalAmount < 2000) {
            throw new Error("PayOS yêu cầu đơn hàng thanh toán qua QR phải từ 2,000 VNĐ trở lên.");
        }

        // 4. TẠO MÃ ĐƠN HÀNG VÀ LƯU VÀO DATABASE
        const orderCodeNum = Math.floor(100000 + Math.random() * 900000);
        const order = await Order.create(
            {
                userId,
                orderCode: orderCodeNum,
                totalAmount: finalTotalAmount,
                discountCode: finalAppliedCode,
                couponCode: finalAppliedCode,
                discountAmount: discountAmount,
                paymentMethod: paymentMethod || "COD",
                status: "PENDING",
                shippingName: shippingInfo.recipientName,
                shippingPhone: shippingInfo.phoneNumber,
                shippingAddress: shippingInfo.fullAddress,
            },
            { transaction: t },
        );

        // Lưu danh sách sản phẩm của đơn hàng
        await OrderItem.bulkCreate(
            orderItemsData.map((item) => ({ ...item, orderId: order.id })),
            { transaction: t },
        );

        // 5. XỬ LÝ THANH TOÁN QR (PAYOS)
        let payosData = null;
        if (paymentMethod === "QR") {
            const paymentBody = {
                orderCode: orderCodeNum,
                amount: finalTotalAmount,
                description: `Thanh toan don #${orderCodeNum}`,
                items: orderItemsData.map((i) => ({
                    name: i.name,
                    quantity: i.quantity,
                    price: i.priceAtPurchase,
                })),
                returnUrl: `http://localhost:3000/cart?success=true&orderCode=${orderCodeNum}`,
                cancelUrl: `http://localhost:3000/cart?cancel=true&orderCode=${orderCodeNum}`,
            };

            payosData = await payos.createPaymentLink(paymentBody);
        }

        // 6. HOÀN TẤT VÀ PHẢN HỒI
        await t.commit(); // Lưu vĩnh viễn mọi thay đổi vào Database

        // Gửi email thông báo (Chạy ngầm không cần await để nhanh hơn nếu muốn)
        const user = await User.findByPk(userId);
        const emailHtml = generateOrderHtml(order, orderItemsData, paymentMethod === "QR");
        sendEmail(user.email, `Xác nhận đơn hàng #${orderCodeNum}`, emailHtml);

        res.status(201).json({
            message: "Đặt hàng thành công",
            orderCode: orderCodeNum,
            payosData: payosData, // Trả về link QR nếu thanh toán online
        });
    } catch (error) {
        // Nếu có bất kỳ lỗi nào, hủy bỏ toàn bộ quá trình (Trả lại tồn kho...)
        await t.rollback();
        console.error("🔥 LỖI THANH TOÁN:", error);
        res.status(error.status || 500).json({ message: error.message || "Lỗi xử lý đặt hàng" });
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

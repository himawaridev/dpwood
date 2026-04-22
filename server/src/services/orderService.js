const { sequelize } = require("../config/connectSequelize");
const Product = require("../models/product");
const Order = require("../models/order");
const OrderItem = require("../models/orderItem");
const AuditLog = require("../models/auditLog");
const User = require("../models/user");
const Coupon = require("../models/coupon");
const UserCoupon = require("../models/userCoupon");
const paymentService = require("./paymentService");
const sendEmail = require("../utils/sendEmail");
const { generateOrderHtml } = require("../templates/emailTemplates");
const process = require("process");

class OrderService {
    async processCheckout(user, checkoutData) {
        const { id: userId, email: userEmail, name: userName } = user;
        const { items, paymentMethod, shippingInfo, couponCode } = checkoutData;

        if (!items || items.length === 0) throw new Error("Giỏ hàng trống");

        const t = await sequelize.transaction();
        try {
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
                product.sold = (product.sold || 0) + item.quantity;
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

            let discountAmount = 0;
            let appliedCouponCode = null;

            if (couponCode) {
                const coupon = await Coupon.findOne({
                    where: { code: couponCode.toUpperCase() },
                    transaction: t,
                });

                if (!coupon) throw new Error("Mã giảm giá không tồn tại");

                const now = new Date();
                if (!coupon.isActive) throw new Error("Mã giảm giá đã bị vô hiệu hóa");
                if (coupon.startDate > now) throw new Error("Mã giảm giá chưa đến ngày sử dụng");
                if (coupon.expiryDate <= now) throw new Error("Mã giảm giá đã hết hạn");
                if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit)
                    throw new Error("Mã giảm giá đã hết lượt sử dụng");

                const userCoupon = await UserCoupon.findOne({
                    where: { userId, couponId: coupon.id },
                    transaction: t,
                });
                if (!userCoupon) throw new Error("Bạn chưa nhận mã giảm giá này");
                if (userCoupon.isUsed) throw new Error("Bạn đã sử dụng mã này rồi");

                if (totalAmount < coupon.minOrderAmount) {
                    throw new Error(
                        `Đơn hàng tối thiểu ${new Intl.NumberFormat("vi-VN").format(coupon.minOrderAmount)}₫ để áp dụng mã này`,
                    );
                }

                if (coupon.discountType === "percent") {
                    discountAmount = Math.floor((totalAmount * coupon.discountValue) / 100);
                    if (coupon.maxDiscountAmount && discountAmount > coupon.maxDiscountAmount) {
                        discountAmount = Number(coupon.maxDiscountAmount);
                    }
                } else {
                    discountAmount = Number(coupon.discountValue);
                }

                if (discountAmount > totalAmount) discountAmount = totalAmount;

                userCoupon.isUsed = true;
                userCoupon.usedAt = new Date();
                await userCoupon.save({ transaction: t });

                coupon.usedCount += 1;
                await coupon.save({ transaction: t });

                appliedCouponCode = coupon.code;
            }

            const finalAmount = totalAmount - discountAmount;

            if (paymentMethod === "QR" && finalAmount < 2000) {
                throw new Error("PayOS yêu cầu giá trị đơn hàng phải từ 2,000 VNĐ trở lên để tạo mã QR. Vui lòng thêm sản phẩm!");
            }

            const orderCodeNum = Math.floor(100000 + Math.random() * 900000);
            const orderCode = String(orderCodeNum);

            const order = await Order.create(
                {
                    userId,
                    orderCode,
                    totalAmount: finalAmount,
                    couponCode: appliedCouponCode,
                    discountAmount,
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

            let auditLogMsg = `Tạo đơn hàng #${orderCode} - Tổng: ${new Intl.NumberFormat("vi-VN").format(finalAmount)}đ`;
            if (appliedCouponCode) {
                auditLogMsg += ` (Giảm ${new Intl.NumberFormat("vi-VN").format(discountAmount)}đ với mã ${appliedCouponCode})`;
            }

            await AuditLog.create(
                { userId, action: "ORDER_CREATED", details: auditLogMsg },
                { transaction: t }
            );

            let paymentLinkData = null;

            if (paymentMethod === "QR") {
                const paymentData = {
                    orderCode: Number(order.orderCode),
                    amount: process.env.NODE_ENV === "development" ? 2000 : finalAmount,
                    description: `Thanh toán đơn ${order.orderCode}`,
                    returnUrl: `${process.env.FRONTEND_URL}/cart?success=true&orderCode=${order.orderCode}`,
                    cancelUrl: `${process.env.FRONTEND_URL}/cart?cancel=true&orderCode=${order.orderCode}`,
                };

                paymentLinkData = await paymentService.createPaymentLink(paymentData);
            }

            await t.commit();

            if (paymentMethod === "COD") {
                const orderInfo = {
                    orderCode: order.orderCode,
                    customerName: userName || "Quý khách",
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

            return { order, paymentLinkData };
        } catch (error) {
            await t.rollback();
            throw error;
        }
    }
}

module.exports = new OrderService();

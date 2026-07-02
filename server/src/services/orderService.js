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

        if (!items || items.length === 0) throw new Error("Giá» hÃ ng trá»‘ng");

        if (!user.phone) throw new Error("Vui long cap nhat so dien thoai trong ho so truoc khi thanh toan.");
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
                if (!product) throw new Error(`Sáº£n pháº©m khÃ´ng tá»“n táº¡i`);
                if (product.stock < item.quantity)
                    throw new Error(`"${product.name}" chá»‰ cÃ²n ${product.stock} kiá»‡n.`);

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

                if (!coupon) throw new Error("MÃ£ giáº£m giÃ¡ khÃ´ng tá»“n táº¡i");

                const now = new Date();
                if (!coupon.isActive) throw new Error("MÃ£ giáº£m giÃ¡ Ä‘Ã£ bá»‹ vÃ´ hiá»‡u hÃ³a");
                if (coupon.startDate > now) throw new Error("MÃ£ giáº£m giÃ¡ chÆ°a Ä‘áº¿n ngÃ y sá»­ dá»¥ng");
                if (coupon.expiryDate <= now) throw new Error("MÃ£ giáº£m giÃ¡ Ä‘Ã£ háº¿t háº¡n");
                if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit)
                    throw new Error("MÃ£ giáº£m giÃ¡ Ä‘Ã£ háº¿t lÆ°á»£t sá»­ dá»¥ng");

                const userCoupon = await UserCoupon.findOne({
                    where: { userId, couponId: coupon.id },
                    transaction: t,
                });
                if (!userCoupon) throw new Error("Báº¡n chÆ°a nháº­n mÃ£ giáº£m giÃ¡ nÃ y");
                if (userCoupon.isUsed) throw new Error("Báº¡n Ä‘Ã£ sá»­ dá»¥ng mÃ£ nÃ y rá»“i");

                if (totalAmount < coupon.minOrderAmount) {
                    throw new Error(
                        `ÄÆ¡n hÃ ng tá»‘i thiá»ƒu ${new Intl.NumberFormat("vi-VN").format(coupon.minOrderAmount)}â‚« Ä‘á»ƒ Ã¡p dá»¥ng mÃ£ nÃ y`,
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
                throw new Error("PayOS yÃªu cáº§u giÃ¡ trá»‹ Ä‘Æ¡n hÃ ng pháº£i tá»« 2,000 VNÄ trá»Ÿ lÃªn Ä‘á»ƒ táº¡o mÃ£ QR. Vui lÃ²ng thÃªm sáº£n pháº©m!");
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

            let auditLogMsg = `Táº¡o Ä‘Æ¡n hÃ ng #${orderCode} - Tá»•ng: ${new Intl.NumberFormat("vi-VN").format(finalAmount)}Ä‘`;
            if (appliedCouponCode) {
                auditLogMsg += ` (Giáº£m ${new Intl.NumberFormat("vi-VN").format(discountAmount)}Ä‘ vá»›i mÃ£ ${appliedCouponCode})`;
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
                    description: `Thanh toÃ¡n Ä‘Æ¡n ${order.orderCode}`,
                    returnUrl: `${process.env.FRONTEND_URL}/cart?success=true&orderCode=${order.orderCode}`,
                    cancelUrl: `${process.env.FRONTEND_URL}/cart?cancel=true&orderCode=${order.orderCode}`,
                };

                paymentLinkData = await paymentService.createPaymentLink(paymentData);
            }

            await t.commit();

            if (paymentMethod === "COD") {
                const orderInfo = {
                    orderCode: order.orderCode,
                    customerName: userName || "QuÃ½ khÃ¡ch",
                    shippingName: order.shippingName,
                    shippingPhone: order.shippingPhone,
                    shippingAddress: order.shippingAddress,
                    totalAmount: order.totalAmount,
                };
                sendEmail(
                    userEmail,
                    `[DPWOOD] XÃ¡c nháº­n Ä‘áº·t hÃ ng #${orderCode}`,
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

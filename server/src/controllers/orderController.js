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
const { generateOrderHtml: buildOrderEmail } = require("../templates/emailTemplates");
const paymentService = require("../services/paymentService");

const getFrontendUrl = () =>
    (process.env.FRONTEND_URL || process.env.CLIENT_URL || "http://localhost:3000").replace(/\/$/, "");

const normalizePayosStatus = (paymentInfo) =>
    String(paymentInfo?.status || paymentInfo?.data?.status || "").toUpperCase();

const markOrderAsPaid = async (order, paymentInfo = {}) => {
    if (!order || order.status !== "PENDING") return order;

    order.status = "PAID";
    await order.save();

    const items = await OrderItem.findAll({
        where: { orderId: order.id },
        include: [{ model: Product }],
    });
    const transaction = paymentInfo.transactions?.[0] || {};
    const transactionCode =
        transaction.reference ||
        paymentInfo.transactionReference ||
        paymentInfo.reference ||
        "Giao dich Online";

    await AuditLog.create({
        userId: order.userId,
        action: "PAYMENT_RECEIVED",
        details: `PayOS xac nhan ${new Intl.NumberFormat("vi-VN").format(order.totalAmount)}d cho don #${order.orderCode}. Ma GD: ${transactionCode}`,
    });

    if (order.User && order.User.email) {
        const emailItemsInfo = items.map((item) => ({
            name: item.Product?.name || "San pham",
            quantity: item.quantity,
            price: item.priceAtPurchase,
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
            `[DPWOOD] Da thanh toan don #${order.orderCode}`,
            buildOrderEmail(orderInfo, emailItemsInfo, true),
        );
    }

    return order;
};

const checkout = async (req, res) => {
    // 1. Khá»Ÿi táº¡o Transaction Ä‘á»ƒ Ä‘áº£m báº£o tÃ­nh toÃ n váº¹n dá»¯ liá»‡u (Náº¿u lá»—i á»Ÿ báº¥t ká»³ bÆ°á»›c nÃ o, Database sáº½ quay xe - Rollback)
    const t = await sequelize.transaction();
    try {
        const { items, paymentMethod, shippingInfo, discountCode } = req.body;
        const userId = req.user.id;

        if (!items || items.length === 0) {
            return res.status(400).json({ message: "Giá» hÃ ng khÃ´ng Ä‘Æ°á»£c Ä‘á»ƒ trá»‘ng" });
        }

        const accountUser = await User.findByPk(userId, { transaction: t });
        if (!accountUser?.phone) {
            const error = new Error("Vui long cap nhat so dien thoai trong ho so truoc khi thanh toan.");
            error.status = 400;
            throw error;
        }

        let subTotal = 0;
        const orderItemsData = [];

        // 2. DUYá»†T GIá»Ž HÃ€NG VÃ€ TÃNH TOÃN GIÃ TRá»Š THá»°C Táº¾ Tá»ª DATABASE
        for (const item of items) {
            const product = await Product.findByPk(item.productId, { transaction: t });

            if (!product) {
                throw new Error(`Sáº£n pháº©m vá»›i ID ${item.productId} khÃ´ng tá»“n táº¡i`);
            }
            if (product.stock < item.quantity) {
                throw new Error(
                    `Sáº£n pháº©m ${product.name} chá»‰ cÃ²n ${product.stock} sáº£n pháº©m trong kho`,
                );
            }

            // TÃ­nh tiá»n hÃ ng dá»±a trÃªn giÃ¡ thá»±c táº¿ trong Database (Chá»‘ng hack F12)
            const itemPrice = parseFloat(product.price);
            subTotal += itemPrice * item.quantity;

            // Chuáº©n bá»‹ dá»¯ liá»‡u Ä‘á»ƒ lÆ°u vÃ o báº£ng OrderItem sau nÃ y
            orderItemsData.push({
                productId: product.id,
                quantity: item.quantity,
                priceAtPurchase: itemPrice, // LÆ°u giÃ¡ lÃºc mua Ä‘á»ƒ sau nÃ y Admin Ä‘á»•i giÃ¡ khÃ´ng lÃ m sai lá»‹ch sá»­
                name: product.name, // DÃ¹ng Ä‘á»ƒ gá»­i mail hoáº·c táº¡o Ä‘Æ¡n PayOS
            });

            // Cáº­p nháº­t tá»“n kho vÃ  sá»‘ lÆ°á»£ng Ä‘Ã£ bÃ¡n
            product.stock -= item.quantity;
            product.sold += item.quantity;
            await product.save({ transaction: t });
        }

        // 3. Xá»¬ LÃ MÃƒ GIáº¢M GIÃ (Báº¢O Máº¬T TRÃŠN SERVER)
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
                const error = new Error("MÃ£ giáº£m giÃ¡ khÃ´ng tá»“n táº¡i hoáº·c Ä‘Ã£ háº¿t háº¡n.");
                error.status = 400;
                throw error;
            }

            if (coupon.usageLimit && Number(coupon.usedCount || 0) >= Number(coupon.usageLimit)) {
                const error = new Error("MÃ£ giáº£m giÃ¡ Ä‘Ã£ háº¿t lÆ°á»£t sá»­ dá»¥ng.");
                error.status = 400;
                throw error;
            }

            const userCoupon = await UserCoupon.findOne({
                where: { userId, couponId: coupon.id },
                transaction: t,
                lock: true,
            });

            if (!userCoupon) {
                const error = new Error("Báº¡n chÆ°a lÆ°u mÃ£ giáº£m giÃ¡ nÃ y.");
                error.status = 400;
                throw error;
            }

            if (userCoupon.isUsed) {
                const error = new Error("Báº¡n Ä‘Ã£ sá»­ dá»¥ng mÃ£ nÃ y rá»“i.");
                error.status = 400;
                throw error;
            }

            if (subTotal < Number(coupon.minOrderAmount || 0)) {
                const error = new Error(
                    `ÄÆ¡n hÃ ng tá»‘i thiá»ƒu ${new Intl.NumberFormat("vi-VN").format(
                        coupon.minOrderAmount,
                    )}Ä‘ Ä‘á»ƒ Ã¡p dá»¥ng mÃ£ nÃ y.`,
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

        // Kiá»ƒm tra Ä‘iá»u kiá»‡n PayOS (Tá»‘i thiá»ƒu 2,000Ä‘)
        if (paymentMethod === "QR" && finalTotalAmount < 2000) {
            throw new Error("PayOS yÃªu cáº§u Ä‘Æ¡n hÃ ng thanh toÃ¡n qua QR pháº£i tá»« 2,000 VNÄ trá»Ÿ lÃªn.");
        }

        // 4. Táº O MÃƒ ÄÆ N HÃ€NG VÃ€ LÆ¯U VÃ€O DATABASE
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

        // LÆ°u danh sÃ¡ch sáº£n pháº©m cá»§a Ä‘Æ¡n hÃ ng
        await OrderItem.bulkCreate(
            orderItemsData.map((item) => ({ ...item, orderId: order.id })),
            { transaction: t },
        );

        // 5. Xá»¬ LÃ THANH TOÃN QR (PAYOS)
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
                returnUrl: `${getFrontendUrl()}/cart?success=true&orderCode=${orderCodeNum}`,
                cancelUrl: `${getFrontendUrl()}/cart?cancel=true&orderCode=${orderCodeNum}`,
            };

            payosData = await paymentService.createPaymentLink(paymentBody);
        }

        // 6. HOÃ€N Táº¤T VÃ€ PHáº¢N Há»’I
        await t.commit(); // LÆ°u vÄ©nh viá»…n má»i thay Ä‘á»•i vÃ o Database

        // Gá»­i email thÃ´ng bÃ¡o (Cháº¡y ngáº§m khÃ´ng cáº§n await Ä‘á»ƒ nhanh hÆ¡n náº¿u muá»‘n)
        const user = await User.findByPk(userId);
        const orderInfo = {
            orderCode: order.orderCode,
            customerName: user?.name,
            shippingName: order.shippingName,
            shippingPhone: order.shippingPhone,
            shippingAddress: order.shippingAddress,
            totalAmount: order.totalAmount,
        };
        const emailHtml = buildOrderEmail(orderInfo, orderItemsData, paymentMethod === "QR");
        sendEmail(user.email, `[DPWOOD] Xac nhan don hang #${orderCodeNum}`, emailHtml);

        res.status(201).json({
            message: "Äáº·t hÃ ng thÃ nh cÃ´ng",
            orderCode: orderCodeNum,
            payosData: payosData, // Tráº£ vá» link QR náº¿u thanh toÃ¡n online
        });
    } catch (error) {
        // Náº¿u cÃ³ báº¥t ká»³ lá»—i nÃ o, há»§y bá» toÃ n bá»™ quÃ¡ trÃ¬nh (Tráº£ láº¡i tá»“n kho...)
        await t.rollback();
        console.error("ðŸ”¥ Lá»–I THANH TOÃN:", error);
        res.status(error.status || 500).json({ message: error.message || "Lá»—i xá»­ lÃ½ Ä‘áº·t hÃ ng" });
    }
};

const handleWebhook = async (req, res) => {
    try {
        const webhookData = await paymentService.verifyPaymentWebhookData(req.body);
        if (!webhookData || !webhookData.orderCode) return res.json({ success: true });

        const orderCode = String(webhookData.orderCode);
        const order = await Order.findOne({
            where: { orderCode, status: "PENDING" },
            include: [{ model: User, attributes: ["email", "name"] }],
        });

        if (!order) return res.json({ success: true });

        const isPaid =
            String(webhookData.code || "") === "00" ||
            String(webhookData.desc || "").toLowerCase().includes("thanh") ||
            normalizePayosStatus(webhookData) === "PAID";

        if (isPaid) {
            await markOrderAsPaid(order, webhookData);
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
        if (!order) return res.status(404).json({ message: "Khong tim thay don hang" });

        let paymentStatus = order.status;

        if (order.status === "PENDING" && order.paymentMethod === "QR") {
            try {
                const paymentInfo = await paymentService.getPaymentLinkInfo(order.orderCode);
                paymentStatus = normalizePayosStatus(paymentInfo) || order.status;
                if (paymentStatus === "PAID") {
                    await markOrderAsPaid(order, paymentInfo);
                }
            } catch (error) {
                console.warn(`Cannot refresh PayOS status for order #${orderCode}:`, error.message);
            }
        }

        res.json({
            status: order.status,
            paymentStatus,
            orderCode: order.orderCode,
        });
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
        if (!order) throw new Error("KhÃ´ng thá»ƒ há»§y");

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
                details: `Há»§y Ä‘Æ¡n #${orderCode}, Ä‘Ã£ hoÃ n tá»“n kho.`,
            },
            { transaction: t },
        );

        await t.commit();
        res.json({ message: "ÄÃ£ há»§y" });
    } catch (error) {
        await t.rollback();
        res.status(400).json({ message: error.message });
    }
};

// ðŸ”´ ÄÃƒ Bá»” SUNG: Include OrderItem vÃ  Product vÃ o dá»¯ liá»‡u láº¥y ra
const getAllOrdersAdmin = async (req, res) => {
    try {
        const orders = await Order.findAll({
            order: [["createdAt", "DESC"]],
            include: [
                { model: User, attributes: ["name", "email"] },
                { model: OrderItem, include: [{ model: Product }] }, // Láº¥y chi tiáº¿t sáº£n pháº©m vÃ  HÃ¬nh áº£nh
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
        if (!order) return res.status(404).json({ message: "KhÃ´ng tÃ¬m tháº¥y" });
        order.status = req.body.status;
        await order.save();
        res.status(200).json({ message: "Cáº­p nháº­t thÃ nh cÃ´ng", order });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ðŸ”´ ÄÃƒ Bá»” SUNG: Cho trang Profile User cÅ©ng xem Ä‘Æ°á»£c chi tiáº¿t vÃ  HÃ¬nh áº£nh náº¿u cáº§n
const getMyOrders = async (req, res) => {
    try {
        const orders = await Order.findAll({
            where: { userId: req.user.id },
            order: [["createdAt", "DESC"]],
            include: [{ model: OrderItem, include: [{ model: Product }] }],
        });
        res.status(200).json(orders);
    } catch (error) {
        console.error("ðŸ”¥ Lá»–I Cáº¬P NHáº¬T TRáº NG THÃI ÄÆ N HÃ€NG:", error);
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

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
const sendEmailInBackground = require("../utils/sendEmailInBackground");
const { generateOrderHtml: buildOrderEmail } = require("../templates/emailTemplates");
const paymentService = require("../services/paymentService");

const getFrontendUrl = () =>
    (process.env.FRONTEND_URL || process.env.CLIENT_URL || "http://localhost:3000").replace(/\/$/, "");

const ORDER_STATUSES = new Set(["PENDING", "PAID", "SHIPPING", "COMPLETED", "CANCELED"]);
const PAYMENT_METHODS = new Set(["COD", "QR"]);
const QR_PAYMENT_TTL_MS = 10 * 60 * 1000;
const TERMINAL_PAYOS_STATUSES = new Set(["CANCELLED", "CANCELED", "EXPIRED"]);

const normalizeProductVariants = (variants) => (Array.isArray(variants) ? variants : []);

const getVariantLabel = (variant = {}) =>
    [variant.color, variant.size || variant.capacity].filter(Boolean).join(" / ");

const getVariantStockTotal = (variants) =>
    normalizeProductVariants(variants).reduce((sum, variant) => sum + Number(variant.stock || 0), 0);

const findProductVariant = (product, variantId) =>
    normalizeProductVariants(product.variants).find((variant) => String(variant.variantId) === String(variantId));

const normalizePayosStatus = (paymentInfo) =>
    String(paymentInfo?.status || paymentInfo?.data?.status || "").toUpperCase();

const getQrPaymentExpiry = (order) => {
    if (!order || order.paymentMethod !== "QR") return null;
    const storedExpiry = order.paymentExpiresAt ? new Date(order.paymentExpiresAt) : null;
    if (storedExpiry && Number.isFinite(storedExpiry.getTime())) return storedExpiry;

    const createdAt = new Date(order.createdAt || Date.now());
    return new Date(createdAt.getTime() + QR_PAYMENT_TTL_MS);
};

const isQrPaymentExpired = (order, now = Date.now()) => {
    const expiry = getQrPaymentExpiry(order);
    return Boolean(expiry && expiry.getTime() <= now);
};

const getRemainingPaymentSeconds = (order) => {
    const expiry = getQrPaymentExpiry(order);
    if (!expiry) return 0;
    return Math.max(0, Math.ceil((expiry.getTime() - Date.now()) / 1000));
};

const readStoredPaymentData = (order) => {
    if (!order?.paymentData) return {};
    if (typeof order.paymentData === "object") return order.paymentData;
    try {
        return JSON.parse(order.paymentData);
    } catch {
        return {};
    }
};

const serializePayosData = (paymentInfo = {}, order = {}) => {
    const source = paymentInfo?.data && typeof paymentInfo.data === "object" ? paymentInfo.data : paymentInfo;
    const paymentLinkId = source.paymentLinkId || source.id || null;
    const expiry = getQrPaymentExpiry(order);

    return {
        bin: source.bin || null,
        accountNumber: source.accountNumber || null,
        accountName: source.accountName || null,
        amount: Number(source.amount || order.totalAmount || 0),
        description: source.description || `Thanh toan don ${order.orderCode}`,
        orderCode: Number(source.orderCode || order.orderCode || 0),
        currency: source.currency || "VND",
        paymentLinkId,
        status: normalizePayosStatus(source) || "PENDING",
        expiredAt: source.expiredAt || (expiry ? Math.floor(expiry.getTime() / 1000) : null),
        checkoutUrl:
            source.checkoutUrl || (paymentLinkId ? `https://pay.payos.vn/web/${paymentLinkId}` : null),
        qrCode: source.qrCode || null,
    };
};

const getResumablePayosData = (order, paymentInfo = {}) => {
    const providerData = serializePayosData(paymentInfo, order);
    const storedData = Object.fromEntries(
        Object.entries(readStoredPaymentData(order)).filter(([, value]) => value !== null && value !== ""),
    );
    return {
        ...providerData,
        ...storedData,
        status: providerData.status,
        expiredAt: Math.floor(getQrPaymentExpiry(order).getTime() / 1000),
    };
};

const ORDER_PROGRESS = ["PENDING", "PAID", "SHIPPING", "COMPLETED"];

const buildOrderTimeline = (order) => {
    const status = String(order.status || "PENDING").toUpperCase();
    const createdAt = order.createdAt || new Date();
    const updatedAt = order.updatedAt || createdAt;

    if (status === "CANCELED" || status === "CANCELLED") {
        return [
            {
                key: "PENDING",
                title: "Đã đặt hàng",
                description: "Đơn hàng đã được hệ thống ghi nhận.",
                status: "finish",
                date: createdAt,
            },
            {
                key: "CANCELED",
                title: "Đã hủy",
                description: "Đơn hàng đã được hủy và tồn kho đã được hoàn lại.",
                status: "error",
                date: updatedAt,
            },
        ];
    }

    const currentIndex = Math.max(0, ORDER_PROGRESS.indexOf(status));
    const labels = {
        PENDING: ["Đã đặt hàng", "Đơn hàng đã được hệ thống ghi nhận."],
        PAID: [
            "Đã xác nhận",
            order.paymentMethod === "QR"
                ? "Thanh toán PayOS đã được xác nhận."
                : "Đơn hàng đã được xác nhận để xử lý.",
        ],
        SHIPPING: ["Đang giao hàng", "Đơn hàng đang trên đường giao đến bạn."],
        COMPLETED: ["Hoàn tất", "Đơn hàng đã được giao và hoàn tất."],
    };

    return ORDER_PROGRESS.map((key, index) => ({
        key,
        title: labels[key][0],
        description: labels[key][1],
        status:
            index < currentIndex || status === "COMPLETED"
                ? "finish"
                : index === currentIndex
                  ? "process"
                  : "wait",
        date: index === 0 ? createdAt : index <= currentIndex ? updatedAt : null,
    }));
};

const serializeOrder = (order) => {
    const value = order?.toJSON ? order.toJSON() : order;
    const publicValue = { ...value };
    delete publicValue.paymentData;
    const paymentExpiresAt = getQrPaymentExpiry(value);
    return {
        ...publicValue,
        paymentExpiresAt: paymentExpiresAt?.toISOString() || null,
        paymentTimeRemainingSeconds: getRemainingPaymentSeconds(value),
        canResumePayment:
            value.status === "PENDING" && value.paymentMethod === "QR" && !isQrPaymentExpired(value),
        timeline: buildOrderTimeline(value),
    };
};

const markOrderAsPaid = async (order, paymentInfo = {}) => {
    if (!order) return order;

    const t = await sequelize.transaction();
    let paidOrder;
    let changedToPaid = false;
    try {
        paidOrder = await Order.findByPk(order.id, {
            transaction: t,
            lock: t.LOCK.UPDATE,
        });
        if (!paidOrder) {
            await t.rollback();
            return order;
        }

        if (paidOrder.status === "PENDING") {
            paidOrder.status = "PAID";
            await paidOrder.save({ transaction: t });

            const transaction = paymentInfo.transactions?.[0] || {};
            const transactionCode =
                transaction.reference ||
                paymentInfo.transactionReference ||
                paymentInfo.reference ||
                "Giao dich Online";
            await AuditLog.create(
                {
                    userId: paidOrder.userId,
                    action: "PAYMENT_RECEIVED",
                    details: `PayOS xac nhan ${new Intl.NumberFormat("vi-VN").format(paidOrder.totalAmount)}d cho don #${paidOrder.orderCode}. Ma GD: ${transactionCode}`,
                },
                { transaction: t },
            );
            changedToPaid = true;
        }

        await t.commit();
    } catch (error) {
        if (!t.finished) await t.rollback();
        throw error;
    }

    order.status = paidOrder.status;
    if (!changedToPaid) return paidOrder;

    const items = await OrderItem.findAll({
        where: { orderId: paidOrder.id },
        include: [{ model: Product }],
    });
    const orderUser = order.User || (await User.findByPk(paidOrder.userId, { attributes: ["email", "name"] }));

    if (orderUser?.email) {
        const emailItemsInfo = items.map((item) => ({
            name: item.variantLabel
                ? `${item.Product?.name || "San pham"} (${item.variantLabel})`
                : item.Product?.name || "San pham",
            quantity: item.quantity,
            price: item.priceAtPurchase,
        }));
        const orderInfo = {
            orderCode: paidOrder.orderCode,
            customerName: orderUser.name,
            shippingName: paidOrder.shippingName,
            shippingPhone: paidOrder.shippingPhone,
            shippingAddress: paidOrder.shippingAddress,
            totalAmount: paidOrder.totalAmount,
        };
        sendEmailInBackground(
            orderUser.email,
            `[DPWOOD] Da thanh toan don #${paidOrder.orderCode}`,
            buildOrderEmail(orderInfo, emailItemsInfo, true),
            `paid order #${paidOrder.orderCode}`,
        );
    }

    return paidOrder;
};

const createOrderError = (message, status) => {
    const error = new Error(message);
    error.status = status;
    return error;
};

const cancelPendingOrderLocally = async ({ orderCode, userId, reason }) => {
    const t = await sequelize.transaction();
    try {
        const order = await Order.findOne({
            where: { orderCode },
            transaction: t,
            lock: t.LOCK.UPDATE,
        });
        if (!order) throw createOrderError("Không tìm thấy đơn hàng.", 404);
        if (userId && String(order.userId) !== String(userId)) {
            throw createOrderError("Bạn không có quyền hủy đơn hàng này.", 403);
        }
        if (order.status === "CANCELED") {
            await t.rollback();
            return { order, alreadyCanceled: true };
        }
        if (order.status !== "PENDING") {
            throw createOrderError("Trạng thái đơn hàng vừa thay đổi. Vui lòng tải lại.", 409);
        }

        const items = await OrderItem.findAll({ where: { orderId: order.id }, transaction: t });
        for (const item of items) {
            const product = await Product.findByPk(item.productId, {
                transaction: t,
                lock: t.LOCK.UPDATE,
            });
            if (!product) continue;

            const variants = normalizeProductVariants(product.variants);
            const selectedVariant = item.variantId ? findProductVariant(product, item.variantId) : null;
            if (selectedVariant) {
                selectedVariant.stock = Number(selectedVariant.stock || 0) + Number(item.quantity || 0);
                product.variants = variants;
                product.stock = getVariantStockTotal(variants);
            } else {
                product.stock = Number(product.stock || 0) + Number(item.quantity || 0);
            }
            product.sold = Math.max(0, Number(product.sold || 0) - Number(item.quantity || 0));
            await product.save({ transaction: t });
        }

        order.status = "CANCELED";
        await order.save({ transaction: t });
        await AuditLog.create(
            {
                userId: userId || order.userId,
                action: "ORDER_CANCELED",
                details: `${reason || "Hủy đơn"} #${orderCode}, đã hoàn tồn kho.`,
            },
            { transaction: t },
        );

        await t.commit();
        return { order, alreadyCanceled: false };
    } catch (error) {
        if (!t.finished) await t.rollback();
        throw error;
    }
};

const expirePendingQrOrder = async (order) => {
    if (!order || order.status !== "PENDING" || order.paymentMethod !== "QR" || !isQrPaymentExpired(order)) {
        return order;
    }

    const hasProviderExpiry = Boolean(order.paymentExpiresAt);
    try {
        const paymentInfo = await paymentService.getPaymentLinkInfo(order.orderCode);
        const paymentStatus = normalizePayosStatus(paymentInfo);
        if (paymentStatus === "PAID") return markOrderAsPaid(order, paymentInfo);

        if (!TERMINAL_PAYOS_STATUSES.has(paymentStatus)) {
            await paymentService.cancelPaymentLink(order.orderCode, "Mã QR đã hết hạn sau 10 phút");
        }
    } catch (error) {
        console.warn(`Không thể đồng bộ QR hết hạn #${order.orderCode}:`, error.message);
        if (!hasProviderExpiry) return order;
    }

    await cancelPendingOrderLocally({
        orderCode: order.orderCode,
        userId: order.userId,
        reason: "QR hết hạn sau 10 phút",
    });
    return Order.findOne({
        where: { orderCode: order.orderCode },
        include: [{ model: User, attributes: ["email", "name"] }],
    });
};

const expireStaleQrOrders = async () => {
    const now = new Date();
    const legacyCutoff = new Date(now.getTime() - QR_PAYMENT_TTL_MS);
    const candidates = await Order.findAll({
        where: {
            status: "PENDING",
            paymentMethod: "QR",
            [Op.or]: [
                { paymentExpiresAt: { [Op.lte]: now } },
                {
                    paymentExpiresAt: null,
                    createdAt: { [Op.lte]: legacyCutoff },
                },
            ],
        },
        include: [{ model: User, attributes: ["email", "name"] }],
        limit: 100,
    });

    for (const order of candidates) {
        if (!isQrPaymentExpired(order)) continue;
        try {
            await expirePendingQrOrder(order);
        } catch (error) {
            console.warn(`Không thể tự hủy QR hết hạn #${order.orderCode}:`, error.message);
        }
    }
};

const checkout = async (req, res) => {
    // 1. Khởi tạo Transaction để đảm bảo tính toàn vẹn dữ liệu (Nếu lỗi ở bất kỳ bước nào, Database sẽ quay xe - Rollback)
    const t = await sequelize.transaction();
    try {
        const { items, paymentMethod, shippingInfo, discountCode } = req.body;
        const userId = req.user.id;
        const normalizedPaymentMethod = String(paymentMethod || "COD").toUpperCase();

        if (!items || items.length === 0) {
            const error = new Error("Giỏ hàng không được để trống");
            error.status = 400;
            throw error;
        }

        if (!PAYMENT_METHODS.has(normalizedPaymentMethod)) {
            const error = new Error("Phương thức thanh toán không hợp lệ");
            error.status = 400;
            throw error;
        }

        if (!shippingInfo?.recipientName || !shippingInfo?.phoneNumber || !shippingInfo?.fullAddress) {
            const error = new Error("Thông tin giao hàng không hợp lệ");
            error.status = 400;
            throw error;
        }

        const accountUser = await User.findByPk(userId, { transaction: t });
        if (!accountUser?.phone) {
            const error = new Error("Vui long cap nhat so dien thoai trong ho so truoc khi thanh toan.");
            error.status = 400;
            throw error;
        }

        let subTotal = 0;
        const orderItemsData = [];

        // 2. DUYỆT GIỎ HÀNG VÀ TÍNH TOÁN GIÁ TRỊ THỰC TẾ TỪ DATABASE
        for (const item of items) {
            const quantity = Number(item.quantity);
            if (!Number.isInteger(quantity) || quantity <= 0 || quantity > 100) {
                const error = new Error("Số lượng sản phẩm không hợp lệ");
                error.status = 400;
                throw error;
            }

            const product = await Product.findByPk(item.productId, { transaction: t });

            if (!product || product.isActive === false) {
                throw new Error(`Sản phẩm với ID ${item.productId} không tồn tại`);
            }

            const variants = normalizeProductVariants(product.variants);
            const selectedVariant = item.variantId ? findProductVariant(product, item.variantId) : null;
            const variantLabel = selectedVariant ? getVariantLabel(selectedVariant) : item.variantLabel || null;
            const availableStock = selectedVariant ? Number(selectedVariant.stock || 0) : Number(product.stock || 0);
            const itemPrice = selectedVariant?.price ? parseFloat(selectedVariant.price) : parseFloat(product.price);
            const orderItemName = variantLabel ? `${product.name} (${variantLabel})` : product.name;

            if (item.variantId && variants.length > 0 && !selectedVariant) {
                throw new Error(`Biến thể đã chọn của ${product.name} không còn tồn tại`);
            }

            if (availableStock < quantity) {
                throw new Error(
                    `Sản phẩm ${orderItemName} chỉ còn ${availableStock} sản phẩm trong kho`,
                );
            }

            // Tính tiền hàng dựa trên giá thực tế trong Database (Chống hack F12)
            subTotal += itemPrice * quantity;

            // Chuẩn bị dữ liệu để lưu vào bảng OrderItem sau này
            orderItemsData.push({
                productId: product.id,
                quantity,
                priceAtPurchase: itemPrice, // Lưu giá lúc mua để sau này Admin đổi giá không làm sai lịch sử
                variantId: selectedVariant?.variantId || null,
                variantLabel,
                variantSnapshot: selectedVariant || null,
                name: orderItemName, // Dùng để gửi mail hoặc tạo đơn PayOS
            });

            // Cập nhật tồn kho và số lượng đã bán
            if (selectedVariant) {
                selectedVariant.stock = Math.max(0, Number(selectedVariant.stock || 0) - quantity);
                product.variants = variants;
                product.stock = getVariantStockTotal(variants);
            } else {
                product.stock -= quantity;
            }
            product.sold += quantity;
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
        if (normalizedPaymentMethod === "QR" && finalTotalAmount < 2000) {
            throw new Error("PayOS yêu cầu đơn hàng thanh toán qua QR phải từ 2,000 VNĐ trở lên.");
        }

        // 4. TẠO MÃ ĐƠN HÀNG VÀ LƯU VÀO DATABASE
        const orderCodeNum = Math.floor(100000 + Math.random() * 900000);
        const paymentExpiresAt =
            normalizedPaymentMethod === "QR" ? new Date(Date.now() + QR_PAYMENT_TTL_MS) : null;
        const order = await Order.create(
            {
                userId,
                orderCode: orderCodeNum,
                totalAmount: finalTotalAmount,
                discountCode: finalAppliedCode,
                couponCode: finalAppliedCode,
                discountAmount: discountAmount,
                paymentMethod: normalizedPaymentMethod,
                paymentExpiresAt,
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
        if (normalizedPaymentMethod === "QR") {
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
                expiredAt: Math.floor(paymentExpiresAt.getTime() / 1000),
            };

            payosData = await paymentService.createPaymentLink(paymentBody);
            payosData = serializePayosData(payosData, order);
            order.paymentData = payosData;
            await order.save({ transaction: t });
        }

        // 6. HOÀN TẤT VÀ PHẢN HỒI
        await t.commit(); // Lưu vĩnh viễn mọi thay đổi vào Database

        // Gửi email thông báo (Chạy ngầm không cần await để nhanh hơn nếu muốn)
        const user = await User.findByPk(userId);
        const orderInfo = {
            orderCode: order.orderCode,
            customerName: user?.name,
            shippingName: order.shippingName,
            shippingPhone: order.shippingPhone,
            shippingAddress: order.shippingAddress,
            totalAmount: order.totalAmount,
        };
        const emailHtml = buildOrderEmail(orderInfo, orderItemsData, normalizedPaymentMethod === "QR");
        sendEmailInBackground(
            user?.email,
            `[DPWOOD] Xac nhan don hang #${orderCodeNum}`,
            emailHtml,
            `order confirmation #${orderCodeNum}`,
        );

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
        console.warn("PayOS webhook rejected:", error.message);
        return res.status(error.status || 401).json({ success: false, message: "Invalid payment webhook" });
    }
};

const getOrderStatus = async (req, res) => {
    try {
        const { orderCode } = req.params;
        let order = await Order.findOne({
            where: { orderCode },
            include: [{ model: User, attributes: ["email", "name"] }],
        });
        if (!order) return res.status(404).json({ message: "Khong tim thay don hang" });

        const isOwner = String(order.userId) === String(req.user.id);
        const isPrivileged = ["admin", "root", "staff"].includes(req.user.role);
        if (!isOwner && !isPrivileged) {
            return res.status(403).json({ message: "Forbidden" });
        }

        let paymentStatus = order.status;

        if (order.status === "PENDING" && order.paymentMethod === "QR") {
            if (isQrPaymentExpired(order)) {
                order = await expirePendingQrOrder(order);
                paymentStatus = order.status;
            }

            try {
                if (order.status === "PENDING") {
                    const paymentInfo = await paymentService.getPaymentLinkInfo(order.orderCode);
                    paymentStatus = normalizePayosStatus(paymentInfo) || order.status;
                    if (paymentStatus === "PAID") {
                        await markOrderAsPaid(order, paymentInfo);
                    } else if (TERMINAL_PAYOS_STATUSES.has(paymentStatus)) {
                        await cancelPendingOrderLocally({
                            orderCode: order.orderCode,
                            userId: order.userId,
                            reason: "PayOS đã đóng link thanh toán",
                        });
                        order = await Order.findOne({ where: { orderCode } });
                        paymentStatus = order.status;
                    }
                }
            } catch (error) {
                console.warn(`Cannot refresh PayOS status for order #${orderCode}:`, error.message);
            }
        }

        res.json({
            status: order.status,
            paymentStatus,
            orderCode: order.orderCode,
            paymentExpiresAt: getQrPaymentExpiry(order)?.toISOString() || null,
            paymentTimeRemainingSeconds: getRemainingPaymentSeconds(order),
            canResumePayment:
                order.status === "PENDING" && order.paymentMethod === "QR" && !isQrPaymentExpired(order),
            timeline: buildOrderTimeline(order),
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getPaymentLink = async (req, res) => {
    try {
        const { orderCode } = req.params;
        let order = await Order.findOne({
            where: { orderCode },
            include: [{ model: User, attributes: ["email", "name"] }],
        });
        if (!order) return res.status(404).json({ message: "Không tìm thấy đơn hàng." });
        if (String(order.userId) !== String(req.user.id)) {
            return res.status(403).json({ message: "Bạn không có quyền thanh toán đơn hàng này." });
        }
        if (order.paymentMethod !== "QR") {
            return res.status(400).json({ message: "Đơn hàng này không sử dụng thanh toán QR PayOS." });
        }
        if (order.status === "PAID") {
            return res.status(409).json({ message: "Đơn hàng đã được thanh toán.", status: order.status });
        }
        if (order.status === "CANCELED") {
            return res.status(410).json({ message: "Đơn hàng đã bị hủy.", status: order.status });
        }
        if (order.status !== "PENDING") {
            return res.status(409).json({ message: "Đơn hàng không còn chờ thanh toán.", status: order.status });
        }

        if (isQrPaymentExpired(order)) {
            order = await expirePendingQrOrder(order);
            if (order.status === "PAID") {
                return res.status(409).json({ message: "Đơn hàng đã được thanh toán.", status: order.status });
            }
            if (order.status === "CANCELED") {
                return res.status(410).json({
                    message: "Mã QR đã hết hạn sau 10 phút và đơn hàng đã được hủy.",
                    status: order.status,
                });
            }
            return res.status(502).json({
                message: "Chưa thể đóng link PayOS cũ. Vui lòng thử lại sau.",
                status: order.status,
            });
        }

        const paymentInfo = await paymentService.getPaymentLinkInfo(order.orderCode);
        const paymentStatus = normalizePayosStatus(paymentInfo);
        if (paymentStatus === "PAID") {
            await markOrderAsPaid(order, paymentInfo);
            return res.status(409).json({ message: "Đơn hàng đã được thanh toán.", status: "PAID" });
        }
        if (TERMINAL_PAYOS_STATUSES.has(paymentStatus)) {
            await cancelPendingOrderLocally({
                orderCode: order.orderCode,
                userId: order.userId,
                reason: "PayOS đã đóng link thanh toán",
            });
            return res.status(410).json({ message: "Link thanh toán đã hết hiệu lực.", status: "CANCELED" });
        }

        const payosData = getResumablePayosData(order, paymentInfo);
        if (!payosData.checkoutUrl && !payosData.qrCode) {
            return res.status(502).json({ message: "PayOS không trả về link thanh toán hợp lệ." });
        }

        return res.json({
            orderCode: order.orderCode,
            status: order.status,
            expiresAt: getQrPaymentExpiry(order).toISOString(),
            remainingSeconds: getRemainingPaymentSeconds(order),
            payosData,
        });
    } catch (error) {
        console.error(`Lỗi mở lại thanh toán #${req.params.orderCode}:`, error.message);
        return res.status(error.status || 502).json({
            message: error.message || "Không thể mở lại thanh toán PayOS lúc này.",
        });
    }
};

const cancelOrder = async (req, res) => {
    try {
        const { orderCode } = req.params;
        const existingOrder = await Order.findOne({
            where: { orderCode },
            include: [{ model: User, attributes: ["email", "name"] }],
        });
        if (!existingOrder) {
            return res.status(404).json({ message: "Không tìm thấy đơn hàng." });
        }
        if (String(existingOrder.userId) !== String(req.user.id)) {
            return res.status(403).json({ message: "Bạn không có quyền hủy đơn hàng này." });
        }
        if (existingOrder.status === "CANCELED") {
            return res.json({
                message: "Đơn hàng đã được hủy trước đó. Giỏ hàng của bạn được giữ nguyên.",
                alreadyCanceled: true,
            });
        }
        if (existingOrder.status !== "PENDING") {
            return res.status(409).json({ message: "Chỉ có thể hủy đơn hàng đang chờ thanh toán." });
        }

        if (existingOrder.paymentMethod === "QR") {
            try {
                const paymentInfo = await paymentService.getPaymentLinkInfo(existingOrder.orderCode);
                const paymentStatus = normalizePayosStatus(paymentInfo);

                if (paymentStatus === "PAID") {
                    await markOrderAsPaid(existingOrder, paymentInfo);
                    return res.status(409).json({
                        message: "PayOS đã xác nhận thanh toán nên đơn hàng không thể hủy.",
                    });
                }

                if (!TERMINAL_PAYOS_STATUSES.has(paymentStatus)) {
                    await paymentService.cancelPaymentLink(
                        existingOrder.orderCode,
                        "Khách hàng hủy thanh toán trên DPWOOD",
                    );
                }
            } catch (error) {
                console.warn(`Không thể hủy link PayOS #${orderCode}:`, error.message);
                return res.status(502).json({
                    message: "Chưa thể kết nối PayOS để hủy thanh toán. Vui lòng thử lại.",
                });
            }
        }

        const result = await cancelPendingOrderLocally({
            orderCode,
            userId: req.user.id,
            reason: "Khách hàng hủy đơn",
        });
        return res.json({
            message: result.alreadyCanceled
                ? "Đơn hàng đã được hủy trước đó. Giỏ hàng của bạn được giữ nguyên."
                : "Đã hủy thanh toán và hoàn lại tồn kho.",
            alreadyCanceled: result.alreadyCanceled,
        });
    } catch (error) {
        console.error(`Lỗi hủy đơn #${req.params.orderCode}:`, error);
        return res.status(error.status || 500).json({
            message: error.status ? error.message : "Không thể hủy giao dịch lúc này.",
        });
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
            limit: 500,
        });
        res.status(200).json(orders.map(serializeOrder));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateOrderStatusAdmin = async (req, res) => {
    try {
        const order = await Order.findByPk(req.params.id);
        if (!order) return res.status(404).json({ message: "Không tìm thấy" });
        const nextStatus = String(req.body.status || "").toUpperCase();
        if (!ORDER_STATUSES.has(nextStatus)) {
            return res.status(400).json({ message: "Trạng thái đơn hàng không hợp lệ" });
        }
        order.status = nextStatus;
        await order.save();
        res.status(200).json({ message: "Cập nhật thành công", order });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 🔴 ĐÃ BỔ SUNG: Cho trang Profile User cũng xem được chi tiết và Hình ảnh nếu cần
const getMyOrders = async (req, res) => {
    try {
        const pendingQrOrders = await Order.findAll({
            where: { userId: req.user.id, status: "PENDING", paymentMethod: "QR" },
            include: [{ model: User, attributes: ["email", "name"] }],
        });
        for (const pendingOrder of pendingQrOrders) {
            if (!isQrPaymentExpired(pendingOrder)) continue;
            try {
                await expirePendingQrOrder(pendingOrder);
            } catch (error) {
                console.warn(
                    `Không thể cập nhật QR hết hạn #${pendingOrder.orderCode} khi tải hồ sơ:`,
                    error.message,
                );
            }
        }

        const orders = await Order.findAll({
            where: { userId: req.user.id },
            order: [["createdAt", "DESC"]],
            include: [{ model: OrderItem, include: [{ model: Product }] }],
            limit: 100,
        });
        res.status(200).json(orders.map(serializeOrder));
    } catch (error) {
        console.error("🔥 LỖI CẬP NHẬT TRẠNG THÁI ĐƠN HÀNG:", error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    checkout,
    handleWebhook,
    getOrderStatus,
    getPaymentLink,
    cancelOrder,
    getAllOrdersAdmin,
    updateOrderStatusAdmin,
    getMyOrders,
    expireStaleQrOrders,
};

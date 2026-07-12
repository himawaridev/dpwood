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

const ORDER_STATUSES = new Set(["PENDING", "PAID", "SHIPPING", "COMPLETED", "CANCELED"]);
const PAYMENT_METHODS = new Set(["COD", "QR"]);

const normalizeProductVariants = (variants) => (Array.isArray(variants) ? variants : []);

const getVariantLabel = (variant = {}) =>
    [variant.color, variant.size || variant.capacity].filter(Boolean).join(" / ");

const getVariantStockTotal = (variants) =>
    normalizeProductVariants(variants).reduce((sum, variant) => sum + Number(variant.stock || 0), 0);

const findProductVariant = (product, variantId) =>
    normalizeProductVariants(product.variants).find((variant) => String(variant.variantId) === String(variantId));

const normalizePayosStatus = (paymentInfo) =>
    String(paymentInfo?.status || paymentInfo?.data?.status || "").toUpperCase();

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
    return { ...value, timeline: buildOrderTimeline(value) };
};

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
            name: item.variantLabel
                ? `${item.Product?.name || "San pham"} (${item.variantLabel})`
                : item.Product?.name || "San pham",
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
        const order = await Order.create(
            {
                userId,
                orderCode: orderCodeNum,
                totalAmount: finalTotalAmount,
                discountCode: finalAppliedCode,
                couponCode: finalAppliedCode,
                discountAmount: discountAmount,
                paymentMethod: normalizedPaymentMethod,
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
            };

            payosData = await paymentService.createPaymentLink(paymentBody);
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
        sendEmail(user.email, `[DPWOOD] Xac nhan don hang #${orderCodeNum}`, emailHtml);

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
        const order = await Order.findOne({
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
            timeline: buildOrderTimeline(order),
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
        if (!order) throw new Error("Không thể hủy");

        const items = await OrderItem.findAll({ where: { orderId: order.id }, transaction: t });
        for (const item of items) {
            const product = await Product.findByPk(item.productId, {
                transaction: t,
                lock: t.LOCK.UPDATE,
            });
            if (product) {
                const variants = normalizeProductVariants(product.variants);
                const selectedVariant = item.variantId ? findProductVariant(product, item.variantId) : null;
                if (selectedVariant) {
                    selectedVariant.stock = Number(selectedVariant.stock || 0) + Number(item.quantity || 0);
                    product.variants = variants;
                    product.stock = getVariantStockTotal(variants);
                } else {
                    product.stock += item.quantity;
                }
                product.sold = Math.max(0, Number(product.sold || 0) - Number(item.quantity || 0));
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
    cancelOrder,
    getAllOrdersAdmin,
    updateOrderStatusAdmin,
    getMyOrders,
};

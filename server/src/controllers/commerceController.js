const { Op } = require("sequelize");
const { sequelize } = require("../config/connectSequelize");
const Order = require("../models/order");
const OrderItem = require("../models/orderItem");
const Product = require("../models/product");
const Shipment = require("../models/shipment");
const ReturnRequest = require("../models/returnRequest");
const InventoryMovement = require("../models/inventoryMovement");
const CartRecovery = require("../models/cartRecovery");
const { calculateShippingFee } = require("../services/shippingService");
const { recordMovement } = require("../services/inventoryService");
const { MANAGER_ROLES, hasRole } = require("../config/accessControl");

const RETURN_STATUSES = new Set([
    "REQUESTED",
    "APPROVED",
    "REJECTED",
    "IN_TRANSIT",
    "RECEIVED",
    "COMPLETED",
]);
const SHIPMENT_STATUSES = new Set(["READY", "PICKED_UP", "IN_TRANSIT", "DELIVERED", "FAILED", "RETURNED"]);

const isManager = (user) => hasRole(user, MANAGER_ROLES);

const assertOrderAccess = (order, user) => {
    if (!order) {
        const error = new Error("Không tìm thấy đơn hàng.");
        error.status = 404;
        throw error;
    }
    if (!isManager(user) && String(order.userId) !== String(user.id)) {
        const error = new Error("Bạn không có quyền truy cập đơn hàng này.");
        error.status = 403;
        throw error;
    }
};

const getShippingQuote = async (req, res) => {
    const subtotal = Math.max(0, Number(req.query.subtotal || req.body?.subtotal || 0));
    const address = String(req.query.address || req.body?.address || "");
    return res.json({
        shippingFee: calculateShippingFee({ subtotal, address }),
        currency: "VND",
    });
};

const getShipment = async (req, res) => {
    try {
        const order = await Order.findByPk(req.params.orderId, { include: [{ model: Shipment }] });
        assertOrderAccess(order, req.user);
        return res.json(order.Shipment || null);
    } catch (error) {
        return res.status(error.status || 500).json({ message: error.message });
    }
};

const upsertShipment = async (req, res) => {
    try {
        const order = await Order.findByPk(req.params.orderId);
        if (!order) return res.status(404).json({ message: "Không tìm thấy đơn hàng." });

        const status = String(req.body.status || "READY").toUpperCase();
        if (!SHIPMENT_STATUSES.has(status)) {
            return res.status(400).json({ message: "Trạng thái vận chuyển không hợp lệ." });
        }
        const values = {
            carrier: String(req.body.carrier || "").trim() || null,
            service: String(req.body.service || "").trim() || null,
            trackingCode: String(req.body.trackingCode || "").trim() || null,
            status,
            shippingFee: Math.max(0, Number(req.body.shippingFee ?? order.shippingFee ?? 0)),
            estimatedDeliveryAt: req.body.estimatedDeliveryAt || null,
            shippedAt:
                req.body.shippedAt || (["PICKED_UP", "IN_TRANSIT"].includes(status) ? new Date() : null),
            deliveredAt: req.body.deliveredAt || (status === "DELIVERED" ? new Date() : null),
            metadata: req.body.metadata && typeof req.body.metadata === "object" ? req.body.metadata : {},
        };
        const [shipment] = await Shipment.upsert({ orderId: order.id, ...values });

        if (status === "DELIVERED") {
            order.status = "COMPLETED";
            order.fulfillmentStatus = "DELIVERED";
            if (order.paymentMethod === "COD") order.paymentStatus = "PAID";
        } else if (["PICKED_UP", "IN_TRANSIT"].includes(status)) {
            order.status = "SHIPPING";
            order.fulfillmentStatus = "SHIPPED";
        } else {
            order.fulfillmentStatus = status === "READY" ? "PROCESSING" : status;
        }
        await order.save();
        return res.json({ message: "Đã cập nhật vận đơn.", shipment });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

const createReturnRequest = async (req, res) => {
    try {
        const reason = String(req.body.reason || "").trim();
        if (!reason) {
            return res.status(400).json({ message: "Vui lòng chọn lý do đổi trả." });
        }
        const order = await Order.findOne({
            where: { id: req.body.orderId, userId: req.user.id },
            include: [{ model: OrderItem, include: [{ model: Product }] }],
        });
        if (!order) return res.status(404).json({ message: "Không tìm thấy đơn hàng." });
        if (order.status !== "COMPLETED" && order.fulfillmentStatus !== "DELIVERED") {
            return res.status(409).json({ message: "Chỉ có thể yêu cầu đổi trả sau khi đơn đã giao." });
        }

        const largestWindow = Math.max(
            0,
            ...order.OrderItems.map((item) =>
                item.Product?.returnEligible === false ? 0 : Number(item.Product?.returnWindowDays || 7),
            ),
        );
        const deliveredAt = order.updatedAt ? new Date(order.updatedAt) : new Date(order.createdAt);
        const deadline = new Date(deliveredAt.getTime() + largestWindow * 86400000);
        if (!largestWindow || deadline < new Date()) {
            return res.status(409).json({ message: "Đơn hàng đã hết thời hạn đổi trả." });
        }

        const existing = await ReturnRequest.findOne({
            where: {
                orderId: order.id,
                status: { [Op.notIn]: ["REJECTED", "COMPLETED"] },
            },
        });
        if (existing) {
            return res.status(409).json({ message: "Đơn hàng đã có yêu cầu đổi trả đang xử lý." });
        }

        const request = await ReturnRequest.create({
            orderId: order.id,
            userId: req.user.id,
            reason,
            description: String(req.body.description || "").trim() || null,
            images: Array.isArray(req.body.images) ? req.body.images.slice(0, 5) : [],
        });
        return res.status(201).json({ message: "Đã gửi yêu cầu đổi trả.", request });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

const listMyReturns = async (req, res) => {
    const requests = await ReturnRequest.findAll({
        where: { userId: req.user.id },
        include: [{ model: Order, attributes: ["orderCode", "totalAmount", "status"] }],
        order: [["createdAt", "DESC"]],
        limit: 100,
    });
    return res.json(requests);
};

const listReturnsAdmin = async (req, res) => {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const where = req.query.status ? { status: String(req.query.status).toUpperCase() } : {};
    const result = await ReturnRequest.findAndCountAll({
        where,
        include: [{ model: Order, attributes: ["orderCode", "totalAmount", "status"] }],
        order: [["createdAt", "DESC"]],
        limit,
        offset: (page - 1) * limit,
    });
    return res.json({ items: result.rows, pagination: { page, limit, total: result.count } });
};

const updateReturnRequest = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const request = await ReturnRequest.findByPk(req.params.id, {
            transaction,
            lock: transaction.LOCK.UPDATE,
        });
        if (!request) {
            await transaction.rollback();
            return res.status(404).json({ message: "Không tìm thấy yêu cầu đổi trả." });
        }
        const status = String(req.body.status || "").toUpperCase();
        if (!RETURN_STATUSES.has(status)) {
            await transaction.rollback();
            return res.status(400).json({ message: "Trạng thái đổi trả không hợp lệ." });
        }

        const shouldRestock =
            status === "COMPLETED" &&
            req.body.restock === true &&
            request.status !== "COMPLETED";
        request.status = status;
        request.resolutionNote = String(req.body.resolutionNote || "").trim() || null;
        request.refundAmount = Math.max(0, Number(req.body.refundAmount || 0));
        request.reviewedById = req.user.id;
        request.reviewedAt = new Date();
        if (status === "RECEIVED") request.receivedAt = new Date();
        if (status === "COMPLETED") request.completedAt = new Date();

        if (shouldRestock) {
            const items = await OrderItem.findAll({ where: { orderId: request.orderId }, transaction });
            for (const item of items) {
                const product = await Product.findByPk(item.productId, {
                    transaction,
                    lock: transaction.LOCK.UPDATE,
                });
                if (!product) continue;
                const variants = Array.isArray(product.variants) ? product.variants : [];
                const variant = variants.find((value) => String(value.variantId) === String(item.variantId));
                if (variant) {
                    variant.stock = Number(variant.stock || 0) + Number(item.quantity);
                    product.variants = variants;
                    product.stock = variants.reduce((sum, value) => sum + Number(value.stock || 0), 0);
                } else {
                    product.stock = Number(product.stock || 0) + Number(item.quantity);
                }
                await product.save({ transaction });
                await recordMovement(
                    {
                        product,
                        orderId: request.orderId,
                        actorId: req.user.id,
                        variantId: item.variantId,
                        type: "RETURN",
                        quantity: Number(item.quantity),
                        reference: `RETURN:${request.id}`,
                        note: "Nhập lại kho sau đổi trả",
                        idempotencyKey: `return:${request.id}:${item.id}`,
                    },
                    { transaction },
                );
            }
        }
        await request.save({ transaction });
        await transaction.commit();
        return res.json({ message: "Đã cập nhật yêu cầu đổi trả.", request });
    } catch (error) {
        if (!transaction.finished) await transaction.rollback();
        return res.status(500).json({ message: error.message });
    }
};

const listInventoryMovements = async (req, res) => {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 30));
    const where = {};
    if (req.query.productId) where.productId = req.query.productId;
    if (req.query.type) where.type = String(req.query.type).toUpperCase();
    const result = await InventoryMovement.findAndCountAll({
        where,
        include: [{ model: Product, attributes: ["name", "sku", "imageUrl"] }],
        order: [["createdAt", "DESC"]],
        limit,
        offset: (page - 1) * limit,
    });
    return res.json({ items: result.rows, pagination: { page, limit, total: result.count } });
};

const getSavedCart = async (req, res) => {
    const cart = await CartRecovery.findOne({ where: { userId: req.user.id } });
    return res.json(cart || { items: [], subtotal: 0 });
};

const saveCart = async (req, res) => {
    const items = Array.isArray(req.body.items)
        ? req.body.items.slice(0, 100).map((item) => ({
            productId: String(item.productId || "").slice(0, 64),
            variantId: item.variantId ? String(item.variantId).slice(0, 120) : null,
            variantLabel: item.variantLabel ? String(item.variantLabel).slice(0, 200) : null,
            name: String(item.name || "").slice(0, 255),
            price: Math.max(0, Number(item.price || 0)),
            quantity: Math.min(999, Math.max(1, Number(item.quantity || 1))),
            imageUrl: String(item.imageUrl || "").slice(0, 2000),
        }))
        : [];
    const subtotal = items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0,
    );
    if (!items.length) {
        await CartRecovery.destroy({ where: { userId: req.user.id } });
        return res.json({ items: [], subtotal: 0 });
    }
    const [cart] = await CartRecovery.upsert({
        userId: req.user.id,
        items,
        subtotal,
        lastActivityAt: new Date(),
        lastRemindedAt: null,
    });
    return res.json(cart);
};

const clearSavedCart = async (req, res) => {
    await CartRecovery.destroy({ where: { userId: req.user.id } });
    return res.status(204).end();
};

module.exports = {
    getShippingQuote,
    getShipment,
    upsertShipment,
    createReturnRequest,
    listMyReturns,
    listReturnsAdmin,
    updateReturnRequest,
    listInventoryMovements,
    getSavedCart,
    saveCart,
    clearSavedCart,
};

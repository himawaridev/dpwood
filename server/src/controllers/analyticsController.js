const { Op, fn, col, literal } = require("sequelize");
const AnalyticsEvent = require("../models/analyticsEvent");
const Order = require("../models/order");
const OrderItem = require("../models/orderItem");
const Product = require("../models/product");
const { snapshot } = require("../services/requestMetricsService");

const ALLOWED_EVENTS = new Set([
    "page_view",
    "view_item",
    "add_to_cart",
    "begin_checkout",
    "purchase",
    "add_to_wishlist",
    "search",
    "web_vital",
]);

const sanitizeProperties = (properties) => {
    if (!properties || typeof properties !== "object" || Array.isArray(properties)) return {};
    const blocked = new Set(["email", "phone", "password", "token", "address", "name"]);
    return Object.fromEntries(
        Object.entries(properties)
            .filter(([key]) => !blocked.has(String(key).toLowerCase()))
            .slice(0, 20)
            .map(([key, value]) => [
                String(key).slice(0, 60),
                typeof value === "string" ? value.slice(0, 300) : value,
            ]),
    );
};

const trackEvent = async (req, res) => {
    const eventName = String(req.body.eventName || "").trim().toLowerCase();
    if (!ALLOWED_EVENTS.has(eventName)) {
        return res.status(400).json({ message: "Sự kiện analytics không hợp lệ." });
    }
    await AnalyticsEvent.create({
        eventName,
        userId: req.user?.id || null,
        sessionId: String(req.body.sessionId || "").slice(0, 100) || null,
        path: String(req.body.path || "").slice(0, 500) || null,
        properties: sanitizeProperties(req.body.properties),
    });
    return res.status(202).json({ accepted: true });
};

const getCommerceDashboard = async (req, res) => {
    const days = Math.min(365, Math.max(1, Number(req.query.days) || 30));
    const since = new Date(Date.now() - days * 86400000);
    const [events, orderSummary, canceledOrders, topProducts, profitRows] = await Promise.all([
        AnalyticsEvent.findAll({
            attributes: ["eventName", [fn("COUNT", col("id")), "count"]],
            where: { createdAt: { [Op.gte]: since } },
            group: ["eventName"],
            raw: true,
        }),
        Order.findOne({
            attributes: [
                [fn("COUNT", col("id")), "orders"],
                [fn("SUM", col("totalAmount")), "revenue"],
                [
                    fn(
                        "SUM",
                        literal("CASE WHEN status = 'CANCELED' THEN 1 ELSE 0 END"),
                    ),
                    "canceledOrders",
                ],
            ],
            where: {
                createdAt: { [Op.gte]: since },
                status: { [Op.in]: ["PAID", "SHIPPING", "COMPLETED"] },
            },
            raw: true,
        }),
        Order.count({
            where: { createdAt: { [Op.gte]: since }, status: "CANCELED" },
        }),
        OrderItem.findAll({
            attributes: [
                "productId",
                [fn("SUM", col("quantity")), "units"],
                [fn("SUM", literal("quantity * priceAtPurchase")), "sales"],
            ],
            include: [{ model: Product, attributes: ["name", "costPrice", "price", "sku"] }],
            where: { createdAt: { [Op.gte]: since } },
            group: ["productId", "Product.id"],
            order: [[literal("units"), "DESC"]],
            limit: 10,
        }),
        OrderItem.findAll({
            attributes: ["quantity", "priceAtPurchase"],
            include: [
                { model: Product, attributes: ["costPrice"] },
                {
                    model: Order,
                    attributes: [],
                    required: true,
                    where: {
                        createdAt: { [Op.gte]: since },
                        status: { [Op.in]: ["PAID", "SHIPPING", "COMPLETED"] },
                    },
                },
            ],
        }),
    ]);
    const funnel = Object.fromEntries(events.map((event) => [event.eventName, Number(event.count)]));
    const beginCheckout = funnel.begin_checkout || 0;
    const purchases = funnel.purchase || Number(orderSummary?.orders || 0);
    const estimatedGrossProfit = profitRows.reduce((sum, item) => {
        const quantity = Number(item.quantity || 0);
        const revenue = quantity * Number(item.priceAtPurchase || 0);
        const cost = quantity * Number(item.Product?.costPrice || 0);
        return sum + revenue - cost;
    }, 0);
    return res.json({
        periodDays: days,
        funnel,
        conversionRate: beginCheckout ? Number((purchases / beginCheckout).toFixed(4)) : 0,
        orders: Number(orderSummary?.orders || 0),
        revenue: Number(orderSummary?.revenue || 0),
        canceledOrders: Number(canceledOrders || 0),
        estimatedGrossProfit,
        topProducts,
    });
};

const getOperationalMetrics = (_req, res) => res.json(snapshot());

module.exports = { trackEvent, getCommerceDashboard, getOperationalMetrics };

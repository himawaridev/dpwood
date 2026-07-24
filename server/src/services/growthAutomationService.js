const { Op } = require("sequelize");
const CartRecovery = require("../models/cartRecovery");
const Wishlist = require("../models/wishlist");
const Product = require("../models/product");
const User = require("../models/user");
const sendEmail = require("../utils/sendEmail");
const { DEFAULT_PRODUCTION_FRONTEND_URL, getConfiguredFrontendUrl } = require("../config/appConfig");

const ONE_HOUR = 60 * 60 * 1000;
const SITE_URL = getConfiguredFrontendUrl(DEFAULT_PRODUCTION_FRONTEND_URL);
let workerTimer = null;

const escapeHtml = (value) =>
    String(value || "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

const emailLayout = (title, body, actionLabel, actionUrl) => `
<div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;color:#222">
  <div style="border-bottom:3px solid #f09b90;padding:20px 0;font-size:24px;font-weight:700">DPWOOD</div>
  <h1 style="font-size:24px;margin:28px 0 12px">${escapeHtml(title)}</h1>
  <div style="line-height:1.7;color:#555">${body}</div>
  <a href="${escapeHtml(actionUrl)}" style="display:inline-block;margin-top:24px;background:#222;color:#fff;text-decoration:none;padding:13px 22px">${escapeHtml(actionLabel)}</a>
  <p style="margin-top:30px;color:#888;font-size:12px">Email tự động từ DPWOOD. Không chứa thông tin thanh toán.</p>
</div>`;

const runAbandonedCartReminders = async () => {
    const carts = await CartRecovery.findAll({
        where: {
            lastActivityAt: { [Op.lte]: new Date(Date.now() - 3 * ONE_HOUR) },
            subtotal: { [Op.gt]: 0 },
            [Op.or]: [
                { lastRemindedAt: null },
                { lastRemindedAt: { [Op.lte]: new Date(Date.now() - 24 * ONE_HOUR) } },
            ],
        },
        include: [{ model: User, attributes: ["email", "name"] }],
        limit: 50,
        order: [["lastActivityAt", "ASC"]],
    });
    for (const cart of carts) {
        if (!cart.User?.email || String(cart.User.email).endsWith("@telegram.invalid")) continue;
        await sendEmail(
            cart.User.email,
            "[DPWOOD] Sản phẩm trong giỏ vẫn đang chờ bạn",
            emailLayout(
                `Giỏ hàng của ${cart.User.name || "bạn"} vẫn còn sản phẩm`,
                `Bạn đang có ${cart.items.length} sản phẩm chưa hoàn tất thanh toán. Tồn kho và ưu đãi có thể thay đổi, hãy kiểm tra lại trước khi đặt hàng.`,
                "Tiếp tục mua hàng",
                `${SITE_URL}/cart`,
            ),
        );
        cart.lastRemindedAt = new Date();
        await cart.save();
    }
};

const runWishlistPriceAlerts = async () => {
    const items = await Wishlist.findAll({
        where: { priceWhenAdded: { [Op.ne]: null } },
        include: [
            { model: Product, attributes: ["id", "name", "price", "isActive"] },
            { model: User, attributes: ["email", "name"] },
        ],
        limit: 200,
    });
    for (const item of items) {
        const currentPrice = Number(item.Product?.price || 0);
        const oldPrice = Number(item.priceWhenAdded || 0);
        const notifiedPrice = Number(item.lastNotifiedPrice || 0);
        if (
            !item.Product?.isActive ||
            !item.User?.email ||
            currentPrice <= 0 ||
            currentPrice >= oldPrice ||
            (notifiedPrice > 0 && currentPrice >= notifiedPrice)
        ) continue;
        await sendEmail(
            item.User.email,
            `[DPWOOD] ${item.Product.name} vừa giảm giá`,
            emailLayout(
                "Sản phẩm yêu thích vừa có giá tốt hơn",
                `<strong>${escapeHtml(item.Product.name)}</strong> đã giảm từ ${oldPrice.toLocaleString("vi-VN")}đ còn ${currentPrice.toLocaleString("vi-VN")}đ.`,
                "Xem sản phẩm",
                `${SITE_URL}/products/${item.Product.id}`,
            ),
        );
        item.lastNotifiedPrice = currentPrice;
        await item.save();
    }
};

const runGrowthAutomations = async () => {
    if (String(process.env.ENABLE_GROWTH_AUTOMATIONS || "").toLowerCase() !== "true") return;
    try {
        await runAbandonedCartReminders();
        await runWishlistPriceAlerts();
    } catch (error) {
        console.error("Growth automation worker failed:", error.message);
    }
};

const startGrowthAutomationWorker = () => {
    if (workerTimer || String(process.env.ENABLE_GROWTH_AUTOMATIONS || "").toLowerCase() !== "true") return;
    setTimeout(runGrowthAutomations, 2 * 60 * 1000);
    workerTimer = setInterval(runGrowthAutomations, ONE_HOUR);
    workerTimer.unref?.();
};

module.exports = { runGrowthAutomations, startGrowthAutomationWorker };

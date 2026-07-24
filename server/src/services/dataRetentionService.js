const { Op } = require("sequelize");
const AuditLog = require("../models/auditLog");
const AnalyticsEvent = require("../models/analyticsEvent");
const AuthSession = require("../models/authSession");
const CartRecovery = require("../models/cartRecovery");

const DAY_MS = 24 * 60 * 60 * 1000;
const AUTH_ACTIONS = ["LOGIN", "LOGOUT", "LOGIN_FAILED"];
let retentionScheduled = false;

const positiveDays = (value, fallback) => {
    const days = Number(value);
    return Number.isFinite(days) && days > 0 ? days : fallback;
};

const runDataRetention = async () => {
    const authDays = positiveDays(process.env.AUTH_LOG_RETENTION_DAYS, 90);
    const auditDays = positiveDays(process.env.AUDIT_LOG_RETENTION_DAYS, 365);
    const analyticsDays = positiveDays(process.env.ANALYTICS_RETENTION_DAYS, 180);
    const cartDays = positiveDays(process.env.CART_RETENTION_DAYS, 30);
    const now = Date.now();

    const removedAuthLogs = await AuditLog.destroy({
        where: {
            action: { [Op.in]: AUTH_ACTIONS },
            createdAt: { [Op.lt]: new Date(now - authDays * DAY_MS) },
        },
    });
    const removedOldLogs = await AuditLog.destroy({
        where: { createdAt: { [Op.lt]: new Date(now - auditDays * DAY_MS) } },
    });
    const [removedAnalytics, removedSessions, removedCarts] = await Promise.all([
        AnalyticsEvent.destroy({
            where: { createdAt: { [Op.lt]: new Date(now - analyticsDays * DAY_MS) } },
        }),
        AuthSession.destroy({
            where: {
                [Op.or]: [
                    { expiresAt: { [Op.lt]: new Date() } },
                    { revokedAt: { [Op.lt]: new Date(now - 30 * DAY_MS) } },
                ],
            },
        }),
        CartRecovery.destroy({
            where: { lastActivityAt: { [Op.lt]: new Date(now - cartDays * DAY_MS) } },
        }),
    ]);

    if (removedAuthLogs || removedOldLogs) {
        console.log(`Data retention removed ${removedAuthLogs} auth log(s) and ${removedOldLogs} old audit log(s)`);
    }
    if (removedAnalytics || removedSessions || removedCarts) {
        console.log(
            `Data retention removed ${removedAnalytics} analytics event(s), ${removedSessions} auth session(s), and ${removedCarts} stale cart(s)`,
        );
    }
};

const scheduleDataRetention = () => {
    if (retentionScheduled) return;
    retentionScheduled = true;
    const run = () => runDataRetention().catch((error) => console.error("Data retention failed:", error.message));
    setTimeout(run, 5 * 1000);
    const timer = setInterval(run, DAY_MS);
    timer.unref?.();
};

module.exports = { runDataRetention, scheduleDataRetention };

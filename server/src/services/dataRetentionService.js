const { Op } = require("sequelize");
const AuditLog = require("../models/auditLog");

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

    if (removedAuthLogs || removedOldLogs) {
        console.log(`Data retention removed ${removedAuthLogs} auth log(s) and ${removedOldLogs} old audit log(s)`);
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

const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const buildRateLimit = ({ windowMs, max, message }) =>
    rateLimit({
        windowMs,
        max,
        standardHeaders: true,
        legacyHeaders: false,
        message: { message },
    });

const securityHeaders = helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
});

const generalLimiter = buildRateLimit({
    windowMs: 15 * 60 * 1000,
    max: 600,
    message: "Too many requests. Please try again later.",
});

const authLimiter = buildRateLimit({
    windowMs: 15 * 60 * 1000,
    max: 25,
    message: "Too many authentication attempts. Please try again later.",
});

const passwordLimiter = buildRateLimit({
    windowMs: 60 * 60 * 1000,
    max: 10,
    message: "Too many password reset attempts. Please try again later.",
});

const paymentLimiter = buildRateLimit({
    windowMs: 60 * 1000,
    max: 60,
    message: "Too many payment requests. Please try again later.",
});

const supportChatLimiter = buildRateLimit({
    windowMs: 60 * 1000,
    max: 12,
    message: "Too many support chat requests. Please try again later.",
});

const imageProxyLimiter = buildRateLimit({
    windowMs: 60 * 1000,
    max: 60,
    message: "Too many image proxy requests. Please try again later.",
});

const orderStatusLimiter = buildRateLimit({
    windowMs: 60 * 1000,
    max: 30,
    message: "Too many order status requests. Please try again later.",
});

const newsletterLimiter = buildRateLimit({
    windowMs: 60 * 60 * 1000,
    max: 8,
    message: "Bạn đã gửi quá nhiều yêu cầu bản tin. Vui lòng thử lại sau.",
});

module.exports = {
    securityHeaders,
    generalLimiter,
    authLimiter,
    passwordLimiter,
    paymentLimiter,
    supportChatLimiter,
    imageProxyLimiter,
    orderStatusLimiter,
    newsletterLimiter,
};


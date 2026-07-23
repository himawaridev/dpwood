const crypto = require("crypto");

const DEFAULT_MAX_AUTH_AGE_SECONDS = 5 * 60;
const ALLOWED_TELEGRAM_FIELDS = [
    "id",
    "first_name",
    "last_name",
    "username",
    "photo_url",
    "auth_date",
];

const createAuthError = (message, statusCode = 400) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
};

const getTelegramBotToken = () => {
    const botToken = String(process.env.TELEGRAM_BOT_TOKEN || "").trim();
    if (!botToken) {
        throw createAuthError(
            "Server chưa cấu hình Telegram Bot Token.",
            503,
        );
    }
    return botToken;
};

const getMaxAuthAgeSeconds = () => {
    const configured = Number(process.env.TELEGRAM_AUTH_MAX_AGE_SECONDS);
    return Number.isFinite(configured) && configured > 0
        ? configured
        : DEFAULT_MAX_AUTH_AGE_SECONDS;
};

const sanitizeTelegramAuthData = (payload = {}) =>
    Object.fromEntries(
        ALLOWED_TELEGRAM_FIELDS
            .filter((key) => payload[key] !== undefined && payload[key] !== null)
            .map((key) => [key, String(payload[key])]),
    );

const createDataCheckString = (authData) =>
    Object.keys(authData)
        .sort()
        .map((key) => `${key}=${authData[key]}`)
        .join("\n");

const verifyTelegramWidgetData = (payload = {}) => {
    const receivedHash = String(payload.hash || "").trim().toLowerCase();
    if (!/^[a-f0-9]{64}$/.test(receivedHash)) {
        throw createAuthError("Chữ ký đăng nhập Telegram không hợp lệ.");
    }

    const authData = sanitizeTelegramAuthData(payload);
    if (!authData.id || !authData.auth_date) {
        throw createAuthError("Telegram không trả về đủ thông tin xác thực.");
    }

    const authDate = Number(authData.auth_date);
    if (!Number.isInteger(authDate) || authDate <= 0) {
        throw createAuthError("Thời gian xác thực Telegram không hợp lệ.");
    }

    const ageSeconds = Math.floor(Date.now() / 1000) - authDate;
    if (ageSeconds < -30 || ageSeconds > getMaxAuthAgeSeconds()) {
        throw createAuthError(
            "Phiên đăng nhập Telegram đã hết hạn. Vui lòng thử lại.",
        );
    }

    const secretKey = crypto
        .createHash("sha256")
        .update(getTelegramBotToken())
        .digest();
    const expectedHash = crypto
        .createHmac("sha256", secretKey)
        .update(createDataCheckString(authData))
        .digest();
    const receivedHashBuffer = Buffer.from(receivedHash, "hex");

    if (
        receivedHashBuffer.length !== expectedHash.length
        || !crypto.timingSafeEqual(receivedHashBuffer, expectedHash)
    ) {
        throw createAuthError("Không thể xác minh tài khoản Telegram.");
    }

    return authData;
};

module.exports = {
    createDataCheckString,
    sanitizeTelegramAuthData,
    verifyTelegramWidgetData,
};

const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");

process.env.TELEGRAM_BOT_TOKEN = "123456789:telegram-test-token";
process.env.TELEGRAM_AUTH_MAX_AGE_SECONDS = "300";

const {
    createDataCheckString,
    verifyTelegramWidgetData,
} = require("../src/services/telegramAuthService");

const signTelegramPayload = (payload) => {
    const authData = Object.fromEntries(
        Object.entries(payload).map(([key, value]) => [key, String(value)]),
    );
    const secretKey = crypto
        .createHash("sha256")
        .update(process.env.TELEGRAM_BOT_TOKEN)
        .digest();
    const hash = crypto
        .createHmac("sha256", secretKey)
        .update(createDataCheckString(authData))
        .digest("hex");

    return { ...payload, hash };
};

test("xác minh dữ liệu Telegram Login Widget hợp lệ", () => {
    const payload = signTelegramPayload({
        id: 99887766,
        first_name: "DPWOOD",
        last_name: "User",
        username: "dpwood_user",
        auth_date: Math.floor(Date.now() / 1000),
    });

    const result = verifyTelegramWidgetData(payload);
    assert.equal(result.id, "99887766");
    assert.equal(result.username, "dpwood_user");
});

test("từ chối chữ ký Telegram bị sửa", () => {
    const payload = signTelegramPayload({
        id: 99887766,
        first_name: "DPWOOD",
        auth_date: Math.floor(Date.now() / 1000),
    });

    assert.throws(
        () => verifyTelegramWidgetData({ ...payload, first_name: "Attacker" }),
        /Không thể xác minh/,
    );
});

test("từ chối dữ liệu Telegram đã hết hạn", () => {
    const payload = signTelegramPayload({
        id: 99887766,
        first_name: "DPWOOD",
        auth_date: Math.floor(Date.now() / 1000) - 301,
    });

    assert.throws(
        () => verifyTelegramWidgetData(payload),
        /đã hết hạn/,
    );
});

const crypto = require("crypto");

const getRefreshTokenPepper = () =>
    process.env.REFRESH_TOKEN_PEPPER ||
    process.env.JWT_REFRESH_SECRET ||
    process.env.JWT_SECRET ||
    "dpwood-refresh-token-pepper";

const hashRefreshToken = (token) => {
    if (!token) return null;
    return crypto.createHmac("sha256", getRefreshTokenPepper()).update(String(token)).digest("hex");
};

module.exports = { hashRefreshToken };

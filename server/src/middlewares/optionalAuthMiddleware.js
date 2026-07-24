const jwt = require("jsonwebtoken");
const User = require("../models/user");

module.exports = async (req, _res, next) => {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : "";
    if (!token) return next();
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findByPk(decoded.id, {
            attributes: ["id", "role"],
        });
        if (user) req.user = user;
    } catch {
        // Anonymous analytics requests remain valid when a token is absent or stale.
    }
    return next();
};

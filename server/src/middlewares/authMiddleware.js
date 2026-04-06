const jwt = require("jsonwebtoken");
const User = require("../models/user");

const authMiddleware = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findByPk(decoded.id);

        if (!user) {
            return res.status(401).json({ message: "User not found" });
        }

        // 🔴 KIỂM TRA TRẠNG THÁI KHÓA Ở ĐÂY
        if (user.lockUntil && user.lockUntil > Date.now()) {
            return res.status(403).json({
                message: "ACCOUNT_BANNED",
                detail: "Tài khoản của bạn đã bị khóa bởi quản trị viên.",
            });
        }

        req.user = user;
        next();
    } catch (err) {
        return res.status(401).json({ message: "Invalid token" });
    }
};

module.exports = authMiddleware;

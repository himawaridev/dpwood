const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { OAuth2Client } = require("google-auth-library");
const User = require("../models/user");
const sendEmail = require("../utils/sendEmail");
const {
    generateVerificationHtml: buildVerificationEmail,
    generateResetPasswordHtml: buildResetPasswordEmail,
} = require("../templates/emailTemplates");
const { Op } = require("sequelize");
const AuditLog = require("../models/auditLog");

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const VERIFICATION_EMAIL_COOLDOWN_MS = 60 * 1000;
const getFrontendUrl = (req) => {
    const configuredUrl = process.env.FRONTEND_URL || process.env.CLIENT_URL;
    if (configuredUrl) return configuredUrl.split(",")[0].trim().replace(/\/$/, "");

    const origin = req.get("origin");
    if (origin) return origin.replace(/\/$/, "");

    const forwardedHost = req.get("x-forwarded-host");
    const forwardedProto = req.get("x-forwarded-proto") || "https";
    if (forwardedHost) return `${forwardedProto}://${forwardedHost}`.replace(/\/$/, "");

    return "http://localhost:3000";
};

const getVerificationRetryAfter = (user) => {
    if (!user.emailVerifySentAt) return 0;
    const elapsed = Date.now() - new Date(user.emailVerifySentAt).getTime();
    const remaining = VERIFICATION_EMAIL_COOLDOWN_MS - elapsed;
    return remaining > 0 ? Math.ceil(remaining / 1000) : 0;
};

const sendVerificationEmail = async (req, user, options = {}) => {
    const retryAfter = options.enforceCooldown ? getVerificationRetryAfter(user) : 0;
    if (retryAfter > 0) {
        const error = new Error(`Vui long doi ${retryAfter} giay de gui lai email xac minh.`);
        error.statusCode = 429;
        error.retryAfter = retryAfter;
        throw error;
    }

    if (!user.emailVerifyToken) {
        user.emailVerifyToken = crypto.randomBytes(32).toString("hex");
    }
    await user.save();

    const verifyLink = `${getFrontendUrl(req)}/verify/${user.emailVerifyToken}`;
    const emailContent = buildVerificationEmail(user.name || user.username || user.email, verifyLink);
    await sendEmail(user.email, "[DPWOOD] Xac minh tai khoan", emailContent);

    user.emailVerifySentAt = new Date();
    await user.save();
};

// --- HÀM HỖ TRỢ: TẠO GIAO DIỆN EMAIL XÁC THỰC TÀI KHOẢN ---
// =========================================================================

const register = async (req, res) => {
    try {
        const name = String(req.body.name || "").trim();
        const username = String(req.body.username || "").trim();
        const email = String(req.body.email || "").trim().toLowerCase();
        const phone = String(req.body.phone || "").trim();
        const { password } = req.body;

        const exist = await User.findOne({
            where: { [Op.or]: [{ email }, { username }, { phone }] },
        });
        if (exist) {
            if (exist.email === email && !exist.isVerified) {
                await sendVerificationEmail(req, exist, { enforceCooldown: true });
                return res.status(200).json({
                    message: "Tai khoan da ton tai nhung chua xac minh. DPWOOD da gui lai email xac minh.",
                    retryAfter: 60,
                });
            }
            return res.status(400).json({ message: "Email, username, or phone already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({ name, username, email, phone, password: hashedPassword });

        await sendVerificationEmail(req, user);

        // 🔴 Đã thay đổi: Truyền Template HTML thay vì link text

        res.status(201).json({ message: "Dang ky thanh cong. Vui long kiem tra email de xac minh tai khoan." });
    } catch (error) {
        console.error("Register error:", error.message);
        res.status(error.statusCode || 500).json({ message: error.message, retryAfter: error.retryAfter || 0 });
    }
};

const resendVerification = async (req, res) => {
    try {
        const login = String(req.body.email || req.body.login || "").trim().toLowerCase();
        if (!login) {
            return res.status(400).json({ message: "Vui long nhap email can gui lai xac minh." });
        }

        const user = await User.findOne({
            where: {
                [Op.or]: [{ email: login }, { username: login }, { phone: login }],
            },
        });
        if (!user) {
            return res.status(404).json({ message: "Khong tim thay tai khoan can xac minh." });
        }

        if (user.isVerified) {
            return res.status(400).json({ message: "Tai khoan nay da duoc xac minh." });
        }

        await sendVerificationEmail(req, user, { enforceCooldown: true });
        return res.json({ message: "DPWOOD da gui lai email xac minh. Vui long kiem tra hop thu.", retryAfter: 60 });
    } catch (error) {
        console.error("Resend verification error:", error.message);
        return res.status(error.statusCode || 500).json({ message: error.message, retryAfter: error.retryAfter || 0 });
    }
};

const login = async (req, res) => {
    const { login, password } = req.body;
    if (!login || !password) {
        return res.status(400).json({ message: "Please enter username and password" });
    }
    try {
        const user = await User.findOne({
            where: {
                [Op.or]: [{ email: login }, { username: login }, { phone: login }],
            },
        });

        if (!user) {
            return res.status(400).json({ message: "Invalid username or password" });
        }

        if (!user.isVerified) {
            return res.status(403).json({
                message:
                    "Your account has not been verified. Please check your email to activate your account before logging in!",
            });
        }

        if (user.lockUntil && user.lockUntil > Date.now()) {
            const timeLock = user.lockUntil - Date.now();
            const timeLeftMinutes = Math.ceil(timeLock / (1000 * 60));
            return res.status(403).json({
                message: `Account locked. Please try again after: ${timeLeftMinutes} min`,
                timeLeftMinutes: timeLeftMinutes,
            });
        }

        if (!user.password) {
            return res.status(400).json({
                message: "This account uses Google sign-in. Please continue with Google.",
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            user.loginAttempts += 1;
            if (user.loginAttempts >= 5) {
                user.lockUntil = new Date(Date.now() + 15 * 60 * 1000);
                user.loginAttempts = 0;
            }
            await user.save();
            return res.status(400).json({ message: "Invalid username or password" });
        }

        // => reset
        user.loginAttempts = 0;
        user.lockUntil = null;

        const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
            expiresIn: "15m",
        });
        const refreshToken = jwt.sign({ id: user.id }, process.env.JWT_REFRESH_SECRET, {
            expiresIn: "7d",
        });

        user.refreshToken = refreshToken;
        await user.save();

        await AuditLog.create({
            userId: user.id,
            action: "LOGIN",
            details: "Đăng nhập thành công",
        });
        res.json({
            token,
            refreshToken,
            user: {
                name: user.name,
                role: user.role,
                avatarUrl: user.avatarUrl,
            },
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const logout = async (req, res) => {
    try {
        const { refreshToken } = req.body;
        const AuditLog = require("../models/auditLog");
        const User = require("../models/user");

        // Lấy User từ token đăng nhập (do authMiddleware cung cấp)
        // Cách này chắc chắn hơn là tìm qua refreshToken
        const user = await User.findByPk(req.user.id);

        if (user) {
            // 1. Xóa refreshToken trong DB nếu có gửi lên
            if (refreshToken === user.refreshToken) {
                user.refreshToken = null;
                await user.save();
            }

            // 2. LUÔN LUÔN ghi log vì ta đã biết chắc chắn ai đang gọi logout qua Access Token
            await AuditLog.create({
                userId: user.id,
                action: "LOGOUT",
                details: "Người dùng đã đăng xuất thành công",
            });
        }

        res.json({ message: "Logout success" });
    } catch (err) {
        console.error("Logout Error:", err);
        res.status(500).json({ message: "Lỗi hệ thống khi đăng xuất" });
    }
};

const refresh = async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            return res.status(401).json({ message: "No refresh token" });
        }
        const user = await User.findOne({ where: { refreshToken } });
        if (!user) {
            return res.status(403).json({ message: "Invalid refesh token" });
        }
        try {
            jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
            const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
                expiresIn: "15m",
            });
            res.json({ token });
        } catch (error) {
            return res.status(403).json({ message: "Refresh token expired or invalid" });
        }
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

const forgotPassword = async (req, res) => {
    try {
        const { email, phone, username } = req.body;
        const user = await User.findOne({
            where: { [Op.or]: [{ email }, { phone }, { username }] },
        });
        if (!user) {
            return res.status(400).json({ message: "Email, username, or phone not found" });
        }

        const resetToken = crypto.randomBytes(32).toString("hex");
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000);
        await user.save();

        // 🔴 Đã thay đổi: Truyền Template HTML thay vì link text
        const resetLink = `${getFrontendUrl(req)}/reset/${resetToken}`;
        const emailContent = buildResetPasswordEmail(resetLink);

        await sendEmail(email, "[DPWOOD] Dat lai mat khau", emailContent);

        res.json({ message: "Check mail to reset password" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const resetPassword = async (req, res) => {
    try {
        const { token, password } = req.body;
        const user = await User.findOne({ where: { resetPasswordToken: token } });

        if (!user || user.resetPasswordExpires < new Date())
            return res.status(400).json({ message: "Invalid or expired token" });

        user.password = await bcrypt.hash(password, 10);
        user.resetPasswordToken = null;
        user.resetPasswordExpires = null;
        await user.save();

        res.json({ message: "Password reset successfully" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const verifyEmail = async (req, res) => {
    try {
        const { token } = req.params;
        const user = await User.findOne({ where: { emailVerifyToken: token } });
        if (!user) return res.status(400).json({ message: "Invalid token" });

        user.isVerified = true;
        user.emailVerifyToken = null;
        user.emailVerifySentAt = null;
        await user.save();

        res.json({ message: "Email verified" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const googleLogin = async (req, res) => {
    try {
        const { token } = req.body;
        if (!token) return res.status(400).json({ message: "Thiếu token Google." });
        if (!process.env.GOOGLE_CLIENT_ID) {
            return res.status(500).json({ message: "Server chưa cấu hình GOOGLE_CLIENT_ID." });
        }

        let ticket;
        try {
            ticket = await googleClient.verifyIdToken({
                idToken: token,
                audience: process.env.GOOGLE_CLIENT_ID,
            });
        } catch {
            return res.status(400).json({ message: "Token Google không hợp lệ hoặc đã hết hạn." });
        }

        const payload = ticket.getPayload();
        const { email, email_verified: emailVerified, name, picture, sub: googleId } = payload;

        if (!email || !googleId || emailVerified === false) {
            return res.status(400).json({ message: "Google account email is not verified." });
        }

        let user = await User.findOne({
            where: { [Op.or]: [{ email }, { googleId }] },
        });

        if (!user) {
            const baseUsername = email.split("@")[0].toLowerCase().replace(/[^a-z0-9_]/g, "");
            const usernameSeed = baseUsername || `google_${googleId.slice(0, 8)}`;
            let newUsername = usernameSeed;
            let count = 1;

            while (await User.findOne({ where: { username: newUsername } })) {
                newUsername = `${usernameSeed}${count}`;
                count += 1;
            }

            user = await User.create({
                name: name || email,
                username: newUsername,
                email,
                avatarUrl: picture,
                googleId,
                authProvider: "google",
                isVerified: true,
                role: "user",
                password: null,
                phone: null,
            });

            await AuditLog.create({
                userId: user.id,
                action: "REGISTER",
                details: "Đăng ký thành viên thông qua Google",
            });
        } else {
            if (!user.googleId) user.googleId = googleId;
            if (!user.avatarUrl && picture) user.avatarUrl = picture;
            if (!user.isVerified) user.isVerified = true;
            if (!user.authProvider || !user.password) user.authProvider = "google";
            await user.save();
        }

        if (user.lockUntil && user.lockUntil > Date.now()) {
            const timeLock = user.lockUntil - Date.now();
            const timeLeftMinutes = Math.ceil(timeLock / (1000 * 60));
            return res.status(403).json({
                message: `Account locked. Please try again after: ${timeLeftMinutes} min`,
                timeLeftMinutes,
            });
        }

        user.loginAttempts = 0;
        user.lockUntil = null;

        const jwtToken = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
            expiresIn: "15m",
        });
        const refreshToken = jwt.sign({ id: user.id }, process.env.JWT_REFRESH_SECRET, {
            expiresIn: "7d",
        });

        user.refreshToken = refreshToken;
        await user.save();

        await AuditLog.create({
            userId: user.id,
            action: "LOGIN",
            details: "Đăng nhập tự động bằng Google OAuth2",
        });

        res.json({
            token: jwtToken,
            refreshToken,
            user: {
                name: user.name,
                role: user.role,
                avatarUrl: user.avatarUrl,
            },
        });
    } catch (error) {
        console.error("Google Auth Error:", error);
        res.status(500).json({ message: "Lỗi hệ thống khi xử lý đăng nhập Google." });
    }
};

module.exports = {
    register,
    resendVerification,
    login,
    refresh,
    forgotPassword,
    resetPassword,
    verifyEmail,
    logout,
    googleLogin,
};

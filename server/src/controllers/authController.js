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
const { hashRefreshToken } = require("../utils/tokenSecurity");
const { verifyTelegramWidgetData } = require("../services/telegramAuthService");
const AuthSession = require("../models/authSession");
const { ADMIN_ROLES, hasRole } = require("../config/accessControl");
const { getFrontendUrlFromRequest } = require("../config/appConfig");

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const VERIFICATION_EMAIL_COOLDOWN_MS = 60 * 1000;
const TWO_FACTOR_TTL_MS = 5 * 60 * 1000;
const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const getFrontendUrl = (req) => getFrontendUrlFromRequest(req);

const getVerificationRetryAfter = (user) => {
    if (!user.emailVerifySentAt) return 0;
    const elapsed = Date.now() - new Date(user.emailVerifySentAt).getTime();
    const remaining = VERIFICATION_EMAIL_COOLDOWN_MS - elapsed;
    return remaining > 0 ? Math.ceil(remaining / 1000) : 0;
};

const deliverVerificationEmail = async ({ frontendUrl, userId, email, displayName, token }) => {
    const verifyLink = `${frontendUrl}/verify/${token}`;
    const emailContent = buildVerificationEmail(displayName || email, verifyLink);
    await sendEmail(email, "[DPWOOD] Xac minh tai khoan", emailContent);
    console.log(`Verification email queued job completed for user ${userId}`);
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
    user.emailVerifySentAt = new Date();
    await user.save();

    const jobPayload = {
        frontendUrl: getFrontendUrl(req),
        userId: user.id,
        email: user.email,
        displayName: user.name || user.username || user.email,
        token: user.emailVerifyToken,
    };

    await deliverVerificationEmail(jobPayload);
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
            const providerLabel =
                user.authProvider === "telegram" ? "Telegram" : "Google";
            return res.status(400).json({
                message: `This account uses ${providerLabel} sign-in. Please continue with ${providerLabel}.`,
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

        await user.save();
        return respondAfterPrimaryAuth(req, res, user, "Đăng nhập thành công");
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
            const refreshTokenHash = hashRefreshToken(refreshToken);
            if (refreshTokenHash === user.refreshToken) {
                user.refreshToken = null;
                await user.save();
            }
            await AuthSession.update(
                { revokedAt: new Date() },
                {
                    where: {
                        userId: user.id,
                        refreshTokenHash,
                        revokedAt: null,
                    },
                },
            );

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
        try {
            const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
            const refreshTokenHash = hashRefreshToken(refreshToken);
            const session = decoded.sid
                ? await AuthSession.findOne({
                    where: {
                        id: decoded.sid,
                        userId: decoded.id,
                        refreshTokenHash,
                        revokedAt: null,
                    },
                })
                : null;
            const user = await User.findByPk(decoded.id);
            const legacyMatch =
                !decoded.sid && user && user.refreshToken === refreshTokenHash;
            if (!user || (!session && !legacyMatch)) {
                return res.status(403).json({ message: "Refresh token không hợp lệ." });
            }
            if (session && session.expiresAt <= new Date()) {
                return res.status(403).json({ message: "Phiên đăng nhập đã hết hạn." });
            }
            if (session) {
                session.lastUsedAt = new Date();
                await session.save();
            }
            const token = jwt.sign({ id: user.id, role: user.role, sid: session?.id }, process.env.JWT_SECRET, {
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

        await user.save();
        return respondAfterPrimaryAuth(req, res, user, "Đăng nhập bằng Google OAuth2");
    } catch (error) {
        console.error("Google Auth Error:", error);
        res.status(500).json({ message: "Lỗi hệ thống khi xử lý đăng nhập Google." });
    }
};

const hashTwoFactorCode = (userId, code) =>
    crypto
        .createHmac("sha256", process.env.JWT_SECRET)
        .update(`${userId}:${code}`)
        .digest("hex");

const createAuthSession = async (req, user) => {
    const sessionId = crypto.randomUUID();
    const refreshToken = jwt.sign(
        { id: user.id, sid: sessionId },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: "7d" },
    );
    const refreshTokenHash = hashRefreshToken(refreshToken);
    await AuthSession.create({
        id: sessionId,
        userId: user.id,
        refreshTokenHash,
        deviceLabel: String(req.get("user-agent") || "Thiết bị không xác định").slice(0, 160),
        ipAddress: String(req.ip || "").slice(0, 64) || null,
        lastUsedAt: new Date(),
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
    });
    user.refreshToken = refreshTokenHash;
    await user.save();
    return { sessionId, refreshToken };
};

const issueAuthResponse = async (req, user) => {
    const { sessionId, refreshToken } = await createAuthSession(req, user);
    const token = jwt.sign(
        { id: user.id, role: user.role, sid: sessionId },
        process.env.JWT_SECRET,
        { expiresIn: "15m" },
    );
    return {
        token,
        refreshToken,
        user: {
            id: user.id,
            name: user.name,
            role: user.role,
            avatarUrl: user.avatarUrl,
            twoFactorEnabled: user.twoFactorEnabled,
        },
    };
};

const sendTwoFactorChallenge = async (req, user) => {
    const code = String(crypto.randomInt(100000, 1000000));
    user.twoFactorCodeHash = hashTwoFactorCode(user.id, code);
    user.twoFactorExpiresAt = new Date(Date.now() + TWO_FACTOR_TTL_MS);
    await user.save();
    await sendEmail(
        user.email,
        "[DPWOOD] Mã xác thực đăng nhập",
        `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;padding:24px;border:1px solid #eee">
            <h2 style="margin:0 0 12px;color:#222">Xác thực đăng nhập DPWOOD</h2>
            <p>Mã xác thực của bạn là:</p>
            <div style="font-size:32px;font-weight:700;letter-spacing:8px;color:#f09b90">${code}</div>
            <p style="color:#666">Mã có hiệu lực trong 5 phút. Không cung cấp mã này cho bất kỳ ai.</p>
        </div>`,
    );
    return jwt.sign(
        { id: user.id, purpose: "two-factor-login" },
        process.env.JWT_SECRET,
        { expiresIn: "5m" },
    );
};

const respondAfterPrimaryAuth = async (req, res, user, auditDetails) => {
    if (user.twoFactorEnabled && hasRole(user, ADMIN_ROLES)) {
        const challengeToken = await sendTwoFactorChallenge(req, user);
        return res.status(202).json({
            requiresTwoFactor: true,
            challengeToken,
            message: "Mã xác thực đã được gửi đến email quản trị.",
        });
    }

    const response = await issueAuthResponse(req, user);
    await AuditLog.create({
        userId: user.id,
        action: "LOGIN",
        details: auditDetails,
    });
    return res.json(response);
};

const verifyTwoFactor = async (req, res) => {
    try {
        const { challengeToken, code } = req.body;
        const decoded = jwt.verify(challengeToken, process.env.JWT_SECRET);
        if (decoded.purpose !== "two-factor-login") {
            return res.status(400).json({ message: "Phiên xác thực không hợp lệ." });
        }
        const user = await User.findByPk(decoded.id);
        if (
            !user ||
            !user.twoFactorCodeHash ||
            !user.twoFactorExpiresAt ||
            user.twoFactorExpiresAt <= new Date()
        ) {
            return res.status(400).json({ message: "Mã xác thực đã hết hạn." });
        }
        const receivedHash = hashTwoFactorCode(user.id, String(code || "").trim());
        const expected = Buffer.from(user.twoFactorCodeHash, "hex");
        const received = Buffer.from(receivedHash, "hex");
        if (expected.length !== received.length || !crypto.timingSafeEqual(expected, received)) {
            return res.status(400).json({ message: "Mã xác thực không chính xác." });
        }
        user.twoFactorCodeHash = null;
        user.twoFactorExpiresAt = null;
        await user.save();
        const response = await issueAuthResponse(req, user);
        await AuditLog.create({
            userId: user.id,
            action: "LOGIN",
            details: "Đăng nhập quản trị với xác thực hai bước",
        });
        return res.json(response);
    } catch {
        return res.status(400).json({ message: "Phiên xác thực đã hết hạn hoặc không hợp lệ." });
    }
};

const updateTwoFactor = async (req, res) => {
    const enabled = req.body.enabled === true;
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ message: "Không tìm thấy tài khoản." });
    if (!hasRole(user, ADMIN_ROLES)) {
        return res.status(403).json({ message: "2FA quản trị chỉ áp dụng cho admin và root." });
    }
    user.twoFactorEnabled = enabled;
    user.twoFactorCodeHash = null;
    user.twoFactorExpiresAt = null;
    await user.save();
    return res.json({
        message: enabled ? "Đã bật xác thực hai bước." : "Đã tắt xác thực hai bước.",
        twoFactorEnabled: user.twoFactorEnabled,
    });
};

const listSessions = async (req, res) => {
    const sessions = await AuthSession.findAll({
        where: { userId: req.user.id, revokedAt: null, expiresAt: { [Op.gt]: new Date() } },
        attributes: ["id", "deviceLabel", "ipAddress", "lastUsedAt", "expiresAt", "createdAt"],
        order: [["lastUsedAt", "DESC"]],
    });
    return res.json(sessions);
};

const revokeSession = async (req, res) => {
    const [updated] = await AuthSession.update(
        { revokedAt: new Date() },
        { where: { id: req.params.id, userId: req.user.id, revokedAt: null } },
    );
    if (!updated) return res.status(404).json({ message: "Không tìm thấy phiên đăng nhập." });
    return res.json({ message: "Đã thu hồi phiên đăng nhập." });
};

const createUniqueTelegramUsername = async (claims, telegramId) => {
    const preferredUsername = String(claims.username || "")
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, "")
        .slice(0, 32);
    const seed = preferredUsername || `telegram_${telegramId.slice(-10)}`;
    let username = seed;
    let suffix = 1;

    while (await User.findOne({ where: { username } })) {
        username = `${seed.slice(0, 28)}${suffix}`;
        suffix += 1;
    }
    return username;
};

const telegramLogin = async (req, res) => {
    try {
        const claims = verifyTelegramWidgetData(req.body);
        const telegramId = String(claims.id || "").trim();
        if (!telegramId) {
            return res.status(400).json({ message: "Telegram không trả về định danh tài khoản." });
        }

        let user = await User.findOne({ where: { telegramId } });
        if (!user) {
            const username = await createUniqueTelegramUsername(claims, telegramId);
            const displayName = [claims.first_name, claims.last_name]
                .filter(Boolean)
                .join(" ")
                .trim();
            user = await User.create({
                name: displayName || claims.username || `Telegram ${telegramId.slice(-6)}`,
                username,
                email: `telegram-${telegramId}@telegram.invalid`,
                phone: null,
                avatarUrl: claims.photo_url || null,
                telegramId,
                authProvider: "telegram",
                isVerified: true,
                role: "user",
                password: null,
            });
            await AuditLog.create({
                userId: user.id,
                action: "REGISTER",
                details: "Đăng ký thành viên thông qua Telegram Login Widget",
            });
        } else {
            if (!user.avatarUrl && claims.photo_url) user.avatarUrl = claims.photo_url;
            if (!user.isVerified) user.isVerified = true;
            if (!user.password) user.authProvider = "telegram";
            await user.save();
        }

        if (user.lockUntil && user.lockUntil > Date.now()) {
            const timeLeftMinutes = Math.ceil((user.lockUntil - Date.now()) / (1000 * 60));
            return res.status(403).json({
                message: `Tài khoản đang bị khóa. Vui lòng thử lại sau ${timeLeftMinutes} phút.`,
                timeLeftMinutes,
            });
        }

        user.loginAttempts = 0;
        user.lockUntil = null;
        await user.save();
        return respondAfterPrimaryAuth(req, res, user, "Đăng nhập bằng Telegram Login Widget");
    } catch (error) {
        console.error("Telegram Auth Error:", error.message);
        return res.status(error.statusCode || 500).json({
            message: error.statusCode
                ? error.message
                : "Lỗi hệ thống khi xử lý đăng nhập Telegram.",
        });
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
    telegramLogin,
    verifyTwoFactor,
    updateTwoFactor,
    listSessions,
    revokeSession,
};

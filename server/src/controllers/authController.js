const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/user");
const sendEmail = require("../utils/sendEmail");
const { Op } = require("sequelize");
const AuditLog = require("../models/auditLog");

// --- HÀM HỖ TRỢ: TẠO GIAO DIỆN EMAIL XÁC THỰC TÀI KHOẢN ---
const generateVerificationHtml = (name, link) => `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
    <div style="background-color: #001529; color: white; padding: 20px; text-align: center;">
        <h1 style="margin: 0; letter-spacing: 2px;">DPWOOD</h1>
    </div>
    <div style="padding: 30px 20px; text-align: center;">
        <h2 style="color: #333;">Chào mừng bạn đến với DPWOOD!</h2>
        <p style="color: #555; font-size: 16px; line-height: 1.5;">
            Xin chào <strong>${name}</strong>,<br/>
            Cảm ơn bạn đã đăng ký tài khoản tại hệ thống của chúng tôi. Để hoàn tất việc đăng ký và bắt đầu mua sắm, vui lòng xác thực địa chỉ email của bạn bằng cách nhấn vào nút bên dưới:
        </p>
        <a href="${link}" style="display: inline-block; margin: 25px 0; padding: 12px 30px; background-color: #1677ff; color: #fff; text-decoration: none; font-size: 16px; font-weight: bold; border-radius: 5px;">
            Xác Thực Tài Khoản
        </a>
        <p style="color: #999; font-size: 13px;">
            Hoặc bạn có thể copy và dán đường link này vào trình duyệt:<br/>
            <a href="${link}" style="color: #1677ff;">${link}</a>
        </p>
    </div>
    <div style="background-color: #f9f9f9; padding: 15px; text-align: center; color: #888; font-size: 12px; border-top: 1px solid #eee;">
        Email này được gửi tự động từ hệ thống DPWOOD. Vui lòng không trả lời.
    </div>
</div>
`;

// --- HÀM HỖ TRỢ: TẠO GIAO DIỆN EMAIL ĐỔI MẬT KHẨU ---
const generateResetPasswordHtml = (link) => `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
    <div style="background-color: #001529; color: white; padding: 20px; text-align: center;">
        <h1 style="margin: 0; letter-spacing: 2px;">DPWOOD</h1>
    </div>
    <div style="padding: 30px 20px; text-align: center;">
        <h2 style="color: #333;">Yêu cầu đặt lại mật khẩu</h2>
        <p style="color: #555; font-size: 16px; line-height: 1.5;">
            Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản DPWOOD của bạn.<br/>
            Nếu đây là yêu cầu của bạn, vui lòng nhấn vào nút bên dưới để tạo mật khẩu mới. Đường link này có hiệu lực trong vòng <strong>60 phút</strong>.
        </p>
        <a href="${link}" style="display: inline-block; margin: 25px 0; padding: 12px 30px; background-color: #ff4d4f; color: #fff; text-decoration: none; font-size: 16px; font-weight: bold; border-radius: 5px;">
            Đặt Lại Mật Khẩu
        </a>
        <div style="margin-top: 20px; padding: 15px; background-color: #fff1f0; border-left: 4px solid #ff4d4f; text-align: left;">
            <p style="margin: 0; color: #cf1322; font-size: 14px;">
                <strong>Lưu ý bảo mật:</strong> Nếu bạn không yêu cầu đổi mật khẩu, vui lòng bỏ qua email này. Tài khoản của bạn vẫn an toàn.
            </p>
        </div>
    </div>
    <div style="background-color: #f9f9f9; padding: 15px; text-align: center; color: #888; font-size: 12px; border-top: 1px solid #eee;">
        Email này được gửi tự động từ hệ thống DPWOOD. Vui lòng không trả lời.
    </div>
</div>
`;

// =========================================================================

const register = async (req, res) => {
    try {
        const { name, username, email, phone, password } = req.body;

        const exist = await User.findOne({
            where: { [Op.or]: [{ email }, { username }, { phone }] },
        });
        if (exist) {
            return res.status(400).json({ message: "Email, username, or phone already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({ name, username, email, phone, password: hashedPassword });

        const verifyToken = crypto.randomBytes(32).toString("hex");
        user.emailVerifyToken = verifyToken;
        await user.save();

        // 🔴 Đã thay đổi: Truyền Template HTML thay vì link text
        const verifyLink = `http://localhost:3000/verify/${verifyToken}`;
        const emailContent = generateVerificationHtml(name, verifyLink);
        await sendEmail(email, "[DPWOOD] Xác thực tài khoản của bạn", emailContent);

        res.status(201).json({ message: "Register succes. Please check your email" });
    } catch (error) {
        res.status(500).json({ message: error.message });
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
        const resetLink = `http://localhost:3000/reset/${resetToken}`;
        const emailContent = generateResetPasswordHtml(resetLink);

        await sendEmail(email, "[DPWOOD] Yêu cầu đặt lại mật khẩu", emailContent);

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
        await user.save();

        res.json({ message: "Email verified" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = { register, login, refresh, forgotPassword, resetPassword, verifyEmail, logout };

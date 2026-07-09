const AuditLog = require("../models/auditLog");
const User = require("../models/user");
const { Op } = require("sequelize");

const normalizeAccountPhone = (value = "") => {
    const digits = String(value).replace(/\D/g, "");
    if (digits.startsWith("84") && digits.length === 11) return `0${digits.slice(2)}`;
    return digits;
};

const isValidAccountPhone = (phone) => /^0\d{9,10}$/.test(phone);
const ALLOWED_ROLES = new Set(["root", "admin", "user", "seller"]);

// Lấy danh sách tất cả người dùng
const getAllUsers = async (req, res) => {
    try {
        const users = await User.findAll({
            attributes: { exclude: ["password", "refreshToken"] },
            paranoid: false,
        });
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Cập nhật Role cho người dùng
const updateRole = async (req, res) => {
    try {
        const { id } = req.params;
        const role = String(req.body.role || "").trim();

        if (!ALLOWED_ROLES.has(role)) {
            return res.status(400).json({ message: "Vai trò không hợp lệ" });
        }

        const user = await User.findByPk(id);
        if (!user) return res.status(404).json({ message: "Không tìm thấy người dùng" });

        if (user.role === "root" && req.user.role !== "root") {
            return res.status(403).json({ message: "Không thể thay đổi tài khoản Root" });
        }

        if (["root", "admin"].includes(role) && req.user.role !== "root") {
            return res.status(403).json({ message: "Chỉ Root mới có thể cấp quyền quản trị" });
        }

        user.role = role;
        await user.save();

        res.json({ message: "Cập nhật quyền thành công", user: { id: user.id, role: user.role } });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findByPk(id);

        if (!user) return res.status(404).json({ message: "Không tìm thấy người dùng" });
        if (user.role === "root")
            return res.status(403).json({ message: "Không thể xóa tài khoản Root!" });

        await user.destroy();
        res.json({ message: "Đã xóa tài khoản thành công" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const restoreUser = async (req, res) => {
    try {
        const { id } = req.params;
        // Bắt buộc phải có paranoid: false để tìm được cả những user đã bị xóa mềm
        const user = await User.findByPk(id, { paranoid: false });

        if (!user) return res.status(404).json({ message: "Không tìm thấy người dùng" });

        // Lệnh thần thánh của Sequelize: Phục hồi tài khoản
        await user.restore();

        res.json({ message: "Đã khôi phục tài khoản thành công" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const toggleBanUser = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findByPk(id);
        const AuditLog = require("../models/auditLog");

        if (!user) return res.status(404).json({ message: "Không tìm thấy người dùng" });
        if (user.role === "root")
            return res.status(403).json({ message: "Không thể khóa tài khoản Root!" });

        if (user.lockUntil && user.lockUntil > Date.now()) {
            user.lockUntil = null;
            user.loginAttempts = 0;
            await user.save();

            await AuditLog.create({
                userId: user.id,
                action: "SYSTEM",
                details: "Tài khoản được mở khóa",
            });
            return res.json({ message: "Đã mở khóa tài khoản" });
        } else {
            const banTime = new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000);
            user.lockUntil = banTime;
            // Xóa luôn refresh token trong DB để họ không thể silent refresh được nữa
            user.refreshToken = null;
            await user.save();

            // 🔴 GHI LOG THEO YÊU CẦU CỦA BẠN
            await AuditLog.create({
                userId: user.id,
                action: "LOGOUT",
                details: "Tài khoản bị cấm (Hệ thống cưỡng chế đăng xuất)",
            });

            const io = req.app.get("io");
            const userSockets = req.app.get("userSockets");
            const targetSocketId = userSockets.get(user.id); // Tìm xem họ có online không

            if (targetSocketId) {
                // Nếu online, bắn tín hiệu đuổi ra ngoài
                io.to(targetSocketId).emit("force_logout");
            }

            return res.json({ message: "Đã cấm tài khoản thành công" });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getSystemLogs = async (req, res) => {
    try {
        const { search, me } = req.query;

        // Khởi tạo cấu hình truy vấn cơ bản
        const queryOptions = {
            where: {},
            include: [
                {
                    model: User,
                    attributes: ["name", "email"],
                    // Quan trọng: Phải đặt "required: false" nếu muốn dùng LEFT JOIN
                    // nhưng khi có 'where' bên trong include, Sequelize mặc định chuyển sang INNER JOIN
                    required: search ? true : false,
                },
            ],
            order: [["createdAt", "DESC"]],
            limit: 200,
        };

        if (me === "true") {
            queryOptions.where.userId = req.user.id;
        } else {
            // Nếu không phải xem cá nhân, bắt buộc phải là Admin
            if (req.user.role !== "admin" && req.user.role !== "root") {
                return res.status(403).json({ message: "Bạn không có quyền truy cập nhật ký này" });
            }
        }

        // Nếu có từ khóa tìm kiếm, ta mới gán 'where' vào trong include
        if (search) {
            queryOptions.include[0].where = {
                [Op.or]: [
                    { email: { [Op.like]: `%${search}%` } },
                    { name: { [Op.like]: `%${search}%` } },
                ],
            };
        }

        const logs = await AuditLog.findAll(queryOptions);
        res.json(logs);
    } catch (error) {
        // Log lỗi chi tiết ra Terminal của VS Code để bạn dễ theo dõi
        console.error("❌ Lỗi tại getSystemLogs:", error);
        res.status(500).json({ message: "Lỗi máy chủ khi lấy nhật ký" });
    }
};

const getMe = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id, {
            attributes: { exclude: ["password", "refreshToken"] },
        });

        if (!user) return res.status(404).json({ message: "Không tìm thấy người dùng" });
        res.status(200).json(user);
    } catch (error) {
        console.error("Lỗi getMe:", error);
        res.status(500).json({ message: "Lỗi máy chủ" });
    }
};

// [PUT] Cập nhật thông tin cá nhân (Đổi thành const)
const updateMe = async (req, res) => {
    try {
        const { name, avatarUrl, phone } = req.body;
        const user = await User.findByPk(req.user.id);

        if (!user) return res.status(404).json({ message: "Khong tim thay nguoi dung" });

        if (name) user.name = name;
        if (avatarUrl) user.avatarUrl = avatarUrl;

        if (phone !== undefined) {
            const normalizedPhone = normalizeAccountPhone(phone);
            if (!isValidAccountPhone(normalizedPhone)) {
                return res.status(400).json({ message: "So dien thoai khong hop le." });
            }

            if (user.phone && user.phone !== normalizedPhone) {
                return res.status(403).json({
                    message: "So dien thoai goc chi co the thay doi trong trang quan tri.",
                });
            }

            if (!user.phone) {
                const existedPhone = await User.findOne({
                    where: {
                        phone: normalizedPhone,
                        id: { [Op.ne]: user.id },
                    },
                });
                if (existedPhone) {
                    return res.status(400).json({ message: "So dien thoai da duoc su dung." });
                }
                user.phone = normalizedPhone;
            }
        }

        await user.save();

        res.status(200).json({
            message: "Cap nhat thanh cong",
            user: { name: user.name, avatarUrl: user.avatarUrl, phone: user.phone },
        });
    } catch (error) {
        console.error("Loi updateMe:", error);
        res.status(500).json({ message: "Loi may chu" });
    }
};

const updateUserPhone = async (req, res) => {
    try {
        const { id } = req.params;
        const normalizedPhone = normalizeAccountPhone(req.body.phone);

        if (!isValidAccountPhone(normalizedPhone)) {
            return res.status(400).json({ message: "So dien thoai khong hop le." });
        }

        const user = await User.findByPk(id);
        if (!user) return res.status(404).json({ message: "Khong tim thay nguoi dung" });

        const existedPhone = await User.findOne({
            where: {
                phone: normalizedPhone,
                id: { [Op.ne]: user.id },
            },
        });
        if (existedPhone) {
            return res.status(400).json({ message: "So dien thoai da duoc su dung." });
        }

        user.phone = normalizedPhone;
        await user.save();

        res.json({
            message: "Cap nhat so dien thoai thanh cong",
            user: { id: user.id, phone: user.phone },
        });
    } catch (error) {
        console.error("Loi updateUserPhone:", error);
        res.status(500).json({ message: "Loi may chu" });
    }
};

module.exports = {
    getAllUsers,
    updateRole,
    deleteUser,
    toggleBanUser,
    getSystemLogs,
    getMe,
    updateMe,
    updateUserPhone,
    restoreUser,
};

const AuditLog = require("../models/auditLog");
const User = require("../models/user");
const { Op } = require("sequelize");

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
        const { role } = req.body;

        const user = await User.findByPk(id);
        if (!user) return res.status(404).json({ message: "Không tìm thấy người dùng" });

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
            attributes: { exclude: ["password"] },
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
        const { name, avatarUrl } = req.body;
        const user = await User.findByPk(req.user.id);

        if (!user) return res.status(404).json({ message: "Không tìm thấy người dùng" });

        if (name) user.name = name;
        if (avatarUrl) user.avatarUrl = avatarUrl;

        await user.save();

        res.status(200).json({
            message: "Cập nhật thành công",
            user: { name: user.name, avatarUrl: user.avatarUrl },
        });
    } catch (error) {
        console.error("Lỗi updateMe:", error);
        res.status(500).json({ message: "Lỗi máy chủ" });
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
    restoreUser,
};

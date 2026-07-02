const AuditLog = require("../models/auditLog");
const User = require("../models/user");
const { Op } = require("sequelize");

const normalizeAccountPhone = (value = "") => {
    const digits = String(value).replace(/\D/g, "");
    if (digits.startsWith("84") && digits.length === 11) return `0${digits.slice(2)}`;
    return digits;
};

const isValidAccountPhone = (phone) => /^0\d{9,10}$/.test(phone);

// Láº¥y danh sÃ¡ch táº¥t cáº£ ngÆ°á»i dÃ¹ng
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

// Cáº­p nháº­t Role cho ngÆ°á»i dÃ¹ng
const updateRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;

        const user = await User.findByPk(id);
        if (!user) return res.status(404).json({ message: "KhÃ´ng tÃ¬m tháº¥y ngÆ°á»i dÃ¹ng" });

        user.role = role;
        await user.save();

        res.json({ message: "Cáº­p nháº­t quyá»n thÃ nh cÃ´ng", user: { id: user.id, role: user.role } });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findByPk(id);

        if (!user) return res.status(404).json({ message: "KhÃ´ng tÃ¬m tháº¥y ngÆ°á»i dÃ¹ng" });
        if (user.role === "root")
            return res.status(403).json({ message: "KhÃ´ng thá»ƒ xÃ³a tÃ i khoáº£n Root!" });

        await user.destroy();
        res.json({ message: "ÄÃ£ xÃ³a tÃ i khoáº£n thÃ nh cÃ´ng" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const restoreUser = async (req, res) => {
    try {
        const { id } = req.params;
        // Báº¯t buá»™c pháº£i cÃ³ paranoid: false Ä‘á»ƒ tÃ¬m Ä‘Æ°á»£c cáº£ nhá»¯ng user Ä‘Ã£ bá»‹ xÃ³a má»m
        const user = await User.findByPk(id, { paranoid: false });

        if (!user) return res.status(404).json({ message: "KhÃ´ng tÃ¬m tháº¥y ngÆ°á»i dÃ¹ng" });

        // Lá»‡nh tháº§n thÃ¡nh cá»§a Sequelize: Phá»¥c há»“i tÃ i khoáº£n
        await user.restore();

        res.json({ message: "ÄÃ£ khÃ´i phá»¥c tÃ i khoáº£n thÃ nh cÃ´ng" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const toggleBanUser = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findByPk(id);
        const AuditLog = require("../models/auditLog");

        if (!user) return res.status(404).json({ message: "KhÃ´ng tÃ¬m tháº¥y ngÆ°á»i dÃ¹ng" });
        if (user.role === "root")
            return res.status(403).json({ message: "KhÃ´ng thá»ƒ khÃ³a tÃ i khoáº£n Root!" });

        if (user.lockUntil && user.lockUntil > Date.now()) {
            user.lockUntil = null;
            user.loginAttempts = 0;
            await user.save();

            await AuditLog.create({
                userId: user.id,
                action: "SYSTEM",
                details: "TÃ i khoáº£n Ä‘Æ°á»£c má»Ÿ khÃ³a",
            });
            return res.json({ message: "ÄÃ£ má»Ÿ khÃ³a tÃ i khoáº£n" });
        } else {
            const banTime = new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000);
            user.lockUntil = banTime;
            // XÃ³a luÃ´n refresh token trong DB Ä‘á»ƒ há» khÃ´ng thá»ƒ silent refresh Ä‘Æ°á»£c ná»¯a
            user.refreshToken = null;
            await user.save();

            // ðŸ”´ GHI LOG THEO YÃŠU Cáº¦U Cá»¦A Báº N
            await AuditLog.create({
                userId: user.id,
                action: "LOGOUT",
                details: "TÃ i khoáº£n bá»‹ cáº¥m (Há»‡ thá»‘ng cÆ°á»¡ng cháº¿ Ä‘Äƒng xuáº¥t)",
            });

            const io = req.app.get("io");
            const userSockets = req.app.get("userSockets");
            const targetSocketId = userSockets.get(user.id); // TÃ¬m xem há» cÃ³ online khÃ´ng

            if (targetSocketId) {
                // Náº¿u online, báº¯n tÃ­n hiá»‡u Ä‘uá»•i ra ngoÃ i
                io.to(targetSocketId).emit("force_logout");
            }

            return res.json({ message: "ÄÃ£ cáº¥m tÃ i khoáº£n thÃ nh cÃ´ng" });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getSystemLogs = async (req, res) => {
    try {
        const { search, me } = req.query;

        // Khá»Ÿi táº¡o cáº¥u hÃ¬nh truy váº¥n cÆ¡ báº£n
        const queryOptions = {
            where: {},
            include: [
                {
                    model: User,
                    attributes: ["name", "email"],
                    // Quan trá»ng: Pháº£i Ä‘áº·t "required: false" náº¿u muá»‘n dÃ¹ng LEFT JOIN
                    // nhÆ°ng khi cÃ³ 'where' bÃªn trong include, Sequelize máº·c Ä‘á»‹nh chuyá»ƒn sang INNER JOIN
                    required: search ? true : false,
                },
            ],
            order: [["createdAt", "DESC"]],
            limit: 200,
        };

        if (me === "true") {
            queryOptions.where.userId = req.user.id;
        } else {
            // Náº¿u khÃ´ng pháº£i xem cÃ¡ nhÃ¢n, báº¯t buá»™c pháº£i lÃ  Admin
            if (req.user.role !== "admin" && req.user.role !== "root") {
                return res.status(403).json({ message: "Báº¡n khÃ´ng cÃ³ quyá»n truy cáº­p nháº­t kÃ½ nÃ y" });
            }
        }

        // Náº¿u cÃ³ tá»« khÃ³a tÃ¬m kiáº¿m, ta má»›i gÃ¡n 'where' vÃ o trong include
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
        // Log lá»—i chi tiáº¿t ra Terminal cá»§a VS Code Ä‘á»ƒ báº¡n dá»… theo dÃµi
        console.error("âŒ Lá»—i táº¡i getSystemLogs:", error);
        res.status(500).json({ message: "Lá»—i mÃ¡y chá»§ khi láº¥y nháº­t kÃ½" });
    }
};

const getMe = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id, {
            attributes: { exclude: ["password"] },
        });

        if (!user) return res.status(404).json({ message: "KhÃ´ng tÃ¬m tháº¥y ngÆ°á»i dÃ¹ng" });
        res.status(200).json(user);
    } catch (error) {
        console.error("Lá»—i getMe:", error);
        res.status(500).json({ message: "Lá»—i mÃ¡y chá»§" });
    }
};

// [PUT] Cáº­p nháº­t thÃ´ng tin cÃ¡ nhÃ¢n (Äá»•i thÃ nh const)
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

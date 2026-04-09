const Notification = require("../models/notification");
const { Op } = require("sequelize");

const notificationController = {
    // [PUBLIC] Lấy các thông báo đang bật
    getActiveNotifications: async (req, res) => {
        try {
            const now = new Date();

            const notifications = await Notification.findAll({
                where: {
                    isActive: true,
                    // Điều kiện: (Bắt đầu <= Hiện tại HOẶC Không hẹn giờ) VÀ (Kết thúc >= Hiện tại HOẶC Không hẹn giờ)
                    [Op.and]: [
                        { [Op.or]: [{ startTime: null }, { startTime: { [Op.lte]: now } }] },
                        { [Op.or]: [{ endTime: null }, { endTime: { [Op.gte]: now } }] },
                    ],
                },
                order: [["createdAt", "DESC"]],
            });
            res.status(200).json(notifications);
        } catch (error) {
            res.status(500).json({ message: "Lỗi Server" });
        }
    },

    // [ADMIN] Lấy tất cả thông báo
    getAllNotifications: async (req, res) => {
        try {
            const notifications = await Notification.findAll({ order: [["createdAt", "DESC"]] });
            res.status(200).json(notifications);
        } catch (error) {
            res.status(500).json({ message: "Lỗi Server" });
        }
    },

    // [ADMIN] Tạo thông báo
    createNotification: async (req, res) => {
        try {
            const newNoti = await Notification.create(req.body);
            res.status(201).json(newNoti);
        } catch (error) {
            res.status(400).json({ message: "Dữ liệu không hợp lệ" });
        }
    },

    // [ADMIN] Sửa thông báo
    updateNotification: async (req, res) => {
        try {
            const noti = await Notification.findByPk(req.params.id);
            if (!noti) return res.status(404).json({ message: "Không tìm thấy" });
            await noti.update(req.body);
            res.status(200).json(noti);
        } catch (error) {
            res.status(400).json({ message: "Dữ liệu không hợp lệ" });
        }
    },

    // [ADMIN] Xóa thông báo
    deleteNotification: async (req, res) => {
        try {
            const noti = await Notification.findByPk(req.params.id);
            if (!noti) return res.status(404).json({ message: "Không tìm thấy" });
            await noti.destroy();
            res.status(200).json({ message: "Xóa thành công" });
        } catch (error) {
            res.status(500).json({ message: "Lỗi Server" });
        }
    },
};

module.exports = notificationController;

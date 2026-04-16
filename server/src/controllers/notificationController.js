const Notification = require("../models/notification");
const { Op } = require("sequelize");

// ==========================================
// [PUBLIC] ROUTE CHO KHÁCH HÀNG
// ==========================================
const getActiveNotifications = async (req, res) => {
    try {
        const now = new Date();
        const notifications = await Notification.findAll({
            where: {
                isActive: true,
                [Op.and]: [
                    { [Op.or]: [{ startTime: null }, { startTime: { [Op.lte]: now } }] },
                    { [Op.or]: [{ endTime: null }, { endTime: { [Op.gte]: now } }] },
                ],
            },
            order: [["createdAt", "DESC"]],
        });
        res.status(200).json(notifications);
    } catch (error) {
        console.error("Lỗi getActiveNotifications:", error);
        res.status(500).json({ message: "Lỗi hệ thống", error: error.message });
    }
};

// ==========================================
// [ADMIN] ROUTE QUẢN TRỊ VIÊN
// ==========================================
const getAllNotifications = async (req, res) => {
    try {
        const notifications = await Notification.findAll({ order: [["createdAt", "DESC"]] });
        res.status(200).json(notifications);
    } catch (error) {
        console.error("Lỗi getAllNotifications:", error);
        res.status(500).json({ message: "Lỗi hệ thống", error: error.message });
    }
};

const createNotification = async (req, res) => {
    try {
        const newNoti = await Notification.create(req.body);
        res.status(201).json(newNoti);
    } catch (error) {
        console.error("Lỗi createNotification:", error);
        res.status(400).json({ message: "Dữ liệu không hợp lệ", error: error.message });
    }
};

const updateNotification = async (req, res) => {
    try {
        const noti = await Notification.findByPk(req.params.id);
        if (!noti) return res.status(404).json({ message: "Không tìm thấy" });

        await noti.update(req.body);
        res.status(200).json(noti);
    } catch (error) {
        console.error("Lỗi updateNotification:", error);
        res.status(400).json({ message: "Dữ liệu không hợp lệ", error: error.message });
    }
};

const deleteNotification = async (req, res) => {
    try {
        const noti = await Notification.findByPk(req.params.id);
        if (!noti) return res.status(404).json({ message: "Không tìm thấy" });

        await noti.destroy();
        res.status(200).json({ message: "Xóa thành công" });
    } catch (error) {
        console.error("Lỗi deleteNotification:", error);
        res.status(500).json({ message: "Lỗi hệ thống", error: error.message });
    }
};

module.exports = {
    getActiveNotifications,
    getAllNotifications,
    createNotification,
    updateNotification,
    deleteNotification,
};

const Discount = require("../models/discount");
const { Op } = require("sequelize");
const { sequelize } = require("../config/connectSequelize");
const { deleteSyncedCouponForDiscount } = require("../services/couponSyncService");

// [PUBLIC] Lấy các mã đang hoạt động cho trang chủ
const getActiveDiscounts = async (req, res) => {
    try {
        const discounts = await Discount.findAll({
            where: {
                isActive: true,
                expiryDate: { [Op.gt]: new Date() }, // Chỉ lấy mã chưa hết hạn
            },
            order: [["percentage", "DESC"]],
        });
        res.status(200).json(discounts);
    } catch (error) {
        res.status(500).json({ message: "Lỗi tải mã giảm giá", error: error.message });
    }
};

// [ADMIN] Lấy tất cả mã
const getAllDiscounts = async (req, res) => {
    try {
        const discounts = await Discount.findAll({ order: [["createdAt", "DESC"]] });
        res.status(200).json(discounts);
    } catch (error) {
        res.status(500).json({ message: "Lỗi hệ thống", error: error.message });
    }
};

// [ADMIN] Tạo mã mới
const createDiscount = async (req, res) => {
    try {
        const newDiscount = await Discount.create(req.body);
        res.status(201).json(newDiscount);
    } catch (error) {
        res.status(400).json({
            message: "Mã code đã tồn tại hoặc dữ liệu sai",
            error: error.message,
        });
    }
};

// [ADMIN] Xóa mã
const deleteDiscount = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const discount = await Discount.findByPk(req.params.id, { transaction: t });
        if (!discount) {
            await t.rollback();
            return res.status(404).json({ message: "Không tìm thấy mã giảm giá" });
        }

        await deleteSyncedCouponForDiscount(discount, t);
        await discount.destroy({ transaction: t });
        await t.commit();
        res.status(200).json({ message: "Xóa thành công" });
    } catch (error) {
        await t.rollback();
        res.status(500).json({ message: "Lỗi khi xóa", error: error.message });
    }
};

const validateDiscount = async (req, res) => {
    try {
        const { code } = req.body;
        const discount = await Discount.findOne({
            where: { code, isActive: true },
        });

        if (!discount) return res.status(404).json({ message: "Mã giảm giá không tồn tại" });
        if (new Date(discount.expiryDate) < new Date())
            return res.status(400).json({ message: "Mã giảm giá đã hết hạn" });

        res.json({ percentage: discount.percentage, description: discount.description });
    } catch (error) {
        res.status(500).json({ message: "Lỗi máy chủ" });
    }
};

module.exports = {
    getActiveDiscounts,
    getAllDiscounts,
    createDiscount,
    deleteDiscount,
    validateDiscount,
};

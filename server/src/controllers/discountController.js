const Discount = require("../models/discount");
const { Op } = require("sequelize");
const { sequelize } = require("../config/connectSequelize");
const { deleteSyncedCouponForDiscount } = require("../services/couponSyncService");

// [PUBLIC] Láº¥y cÃ¡c mÃ£ Ä‘ang hoáº¡t Ä‘á»™ng cho trang chá»§
const getActiveDiscounts = async (req, res) => {
    try {
        const discounts = await Discount.findAll({
            where: {
                isActive: true,
                expiryDate: { [Op.gt]: new Date() }, // Chá»‰ láº¥y mÃ£ chÆ°a háº¿t háº¡n
            },
            order: [["percentage", "DESC"]],
        });
        res.status(200).json(discounts);
    } catch (error) {
        res.status(500).json({ message: "Lá»—i táº£i mÃ£ giáº£m giÃ¡", error: error.message });
    }
};

// [ADMIN] Láº¥y táº¥t cáº£ mÃ£
const getAllDiscounts = async (req, res) => {
    try {
        const discounts = await Discount.findAll({ order: [["createdAt", "DESC"]] });
        res.status(200).json(discounts);
    } catch (error) {
        res.status(500).json({ message: "Lá»—i há»‡ thá»‘ng", error: error.message });
    }
};

// [ADMIN] Táº¡o mÃ£ má»›i
const createDiscount = async (req, res) => {
    try {
        const newDiscount = await Discount.create(req.body);
        res.status(201).json(newDiscount);
    } catch (error) {
        res.status(400).json({
            message: "MÃ£ code Ä‘Ã£ tá»“n táº¡i hoáº·c dá»¯ liá»‡u sai",
            error: error.message,
        });
    }
};

// [ADMIN] XÃ³a mÃ£
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

        if (!discount) return res.status(404).json({ message: "MÃ£ giáº£m giÃ¡ khÃ´ng tá»“n táº¡i" });
        if (new Date(discount.expiryDate) < new Date())
            return res.status(400).json({ message: "MÃ£ giáº£m giÃ¡ Ä‘Ã£ háº¿t háº¡n" });

        res.json({ percentage: discount.percentage, description: discount.description });
    } catch (error) {
        res.status(500).json({ message: "Lá»—i mÃ¡y chá»§" });
    }
};

module.exports = {
    getActiveDiscounts,
    getAllDiscounts,
    createDiscount,
    deleteDiscount,
    validateDiscount,
};

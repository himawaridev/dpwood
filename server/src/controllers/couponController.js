const { Op } = require("sequelize");
const { sequelize } = require("../config/connectSequelize");
const Coupon = require("../models/coupon");
const UserCoupon = require("../models/userCoupon");

// ==========================================
// [ADMIN] Tạo mã giảm giá
// ==========================================
const createCoupon = async (req, res) => {
    try {
        const {
            code,
            description,
            discountType,
            discountValue,
            minOrderAmount,
            maxDiscountAmount,
            usageLimit,
            startDate,
            expiryDate,
        } = req.body;

        if (!code || !discountType || !discountValue || !startDate || !expiryDate) {
            return res.status(400).json({ message: "Vui lòng điền đầy đủ thông tin bắt buộc" });
        }

        const existing = await Coupon.findOne({ where: { code: code.toUpperCase() } });
        if (existing) {
            return res.status(400).json({ message: "Mã giảm giá đã tồn tại" });
        }

        const coupon = await Coupon.create({
            code: code.toUpperCase(),
            description,
            discountType,
            discountValue,
            minOrderAmount: minOrderAmount || 0,
            maxDiscountAmount: maxDiscountAmount || null,
            usageLimit: usageLimit || null,
            startDate,
            expiryDate,
        });

        res.status(201).json({ message: "Tạo mã giảm giá thành công", coupon });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ==========================================
// [ADMIN] Lấy tất cả mã giảm giá
// ==========================================
const getAllCoupons = async (req, res) => {
    try {
        const coupons = await Coupon.findAll({ order: [["createdAt", "DESC"]] });
        res.status(200).json(coupons);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ==========================================
// [ADMIN] Cập nhật mã giảm giá
// ==========================================
const updateCoupon = async (req, res) => {
    try {
        const coupon = await Coupon.findByPk(req.params.id);
        if (!coupon) return res.status(404).json({ message: "Không tìm thấy mã giảm giá" });

        const {
            code,
            description,
            discountType,
            discountValue,
            minOrderAmount,
            maxDiscountAmount,
            usageLimit,
            startDate,
            expiryDate,
            isActive,
        } = req.body;

        // Kiểm tra trùng mã nếu đổi code
        if (code && code.toUpperCase() !== coupon.code) {
            const existing = await Coupon.findOne({ where: { code: code.toUpperCase() } });
            if (existing) {
                return res.status(400).json({ message: "Mã giảm giá đã tồn tại" });
            }
        }

        await coupon.update({
            code: code ? code.toUpperCase() : coupon.code,
            description: description !== undefined ? description : coupon.description,
            discountType: discountType || coupon.discountType,
            discountValue: discountValue !== undefined ? discountValue : coupon.discountValue,
            minOrderAmount: minOrderAmount !== undefined ? minOrderAmount : coupon.minOrderAmount,
            maxDiscountAmount:
                maxDiscountAmount !== undefined ? maxDiscountAmount : coupon.maxDiscountAmount,
            usageLimit: usageLimit !== undefined ? usageLimit : coupon.usageLimit,
            startDate: startDate || coupon.startDate,
            expiryDate: expiryDate || coupon.expiryDate,
            isActive: isActive !== undefined ? isActive : coupon.isActive,
        });

        res.status(200).json({ message: "Cập nhật thành công", coupon });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ==========================================
// [ADMIN] Xóa mã giảm giá
// ==========================================
const deleteCoupon = async (req, res) => {
    try {
        const coupon = await Coupon.findByPk(req.params.id);
        if (!coupon) return res.status(404).json({ message: "Không tìm thấy mã giảm giá" });

        // Xóa tất cả UserCoupon liên quan
        await UserCoupon.destroy({ where: { couponId: coupon.id } });
        await coupon.destroy();

        res.status(200).json({ message: "Đã xóa mã giảm giá" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ==========================================
// [PUBLIC] Lấy mã giảm giá đang hoạt động (cho trang chủ)
// ==========================================
const getActiveCoupons = async (req, res) => {
    try {
        const now = new Date();
        const coupons = await Coupon.findAll({
            where: {
                isActive: true,
                startDate: { [Op.lte]: now },
                expiryDate: { [Op.gt]: now },
                [Op.or]: [
                    { usageLimit: null },
                    { usedCount: { [Op.lt]: sequelize.col("usageLimit") } },
                ],
            },
            order: [["createdAt", "DESC"]],
        });
        res.status(200).json(coupons);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ==========================================
// [USER] Nhận mã giảm giá vào ví
// ==========================================
const claimCoupon = async (req, res) => {
    try {
        const userId = req.user.id;
        const { couponId } = req.body;

        const coupon = await Coupon.findByPk(couponId);
        if (!coupon) return res.status(404).json({ message: "Mã giảm giá không tồn tại" });

        const now = new Date();
        if (!coupon.isActive || coupon.expiryDate <= now || coupon.startDate > now) {
            return res.status(400).json({ message: "Mã giảm giá không còn hiệu lực" });
        }

        if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
            return res.status(400).json({ message: "Mã giảm giá đã hết lượt sử dụng" });
        }

        // Kiểm tra đã nhận chưa
        const existing = await UserCoupon.findOne({
            where: { userId, couponId },
        });
        if (existing) {
            return res.status(400).json({ message: "Bạn đã nhận mã này rồi" });
        }

        await UserCoupon.create({ userId, couponId });
        res.status(200).json({ message: "Nhận mã giảm giá thành công!" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ==========================================
// [USER] Xem ví mã giảm giá của tôi
// ==========================================
const getMyCoupons = async (req, res) => {
    try {
        const userId = req.user.id;
        const userCoupons = await UserCoupon.findAll({
            where: { userId },
            include: [{ model: Coupon }],
            order: [["createdAt", "DESC"]],
        });
        res.status(200).json(userCoupons);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ==========================================
// [USER] Xóa mã giảm giá khỏi ví
// ==========================================
const deleteMyCoupon = async (req, res) => {
    try {
        const userId = req.user.id;
        const userCoupon = await UserCoupon.findOne({
            where: { id: req.params.id, userId },
        });
        if (!userCoupon) return res.status(404).json({ message: "Không tìm thấy" });

        await userCoupon.destroy();
        res.status(200).json({ message: "Đã xóa mã giảm giá khỏi ví" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ==========================================
// [USER] Áp dụng mã giảm giá (validate + tính toán)
// ==========================================
const applyCoupon = async (req, res) => {
    try {
        const userId = req.user.id;
        const { code, totalAmount } = req.body;

        if (!code || !totalAmount) {
            return res.status(400).json({ message: "Thiếu thông tin" });
        }

        const coupon = await Coupon.findOne({ where: { code: code.toUpperCase() } });
        if (!coupon) {
            return res.status(404).json({ message: "Mã giảm giá không tồn tại" });
        }

        const now = new Date();
        if (!coupon.isActive) {
            return res.status(400).json({ message: "Mã giảm giá đã bị vô hiệu hóa" });
        }
        if (coupon.startDate > now) {
            return res.status(400).json({ message: "Mã giảm giá chưa đến ngày sử dụng" });
        }
        if (coupon.expiryDate <= now) {
            return res.status(400).json({ message: "Mã giảm giá đã hết hạn" });
        }
        if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
            return res.status(400).json({ message: "Mã giảm giá đã hết lượt sử dụng" });
        }

        // Kiểm tra user đã nhận mã chưa
        const userCoupon = await UserCoupon.findOne({
            where: { userId, couponId: coupon.id },
        });
        if (!userCoupon) {
            return res.status(400).json({ message: "Bạn chưa nhận mã giảm giá này" });
        }
        if (userCoupon.isUsed) {
            return res.status(400).json({ message: "Bạn đã sử dụng mã này rồi" });
        }

        // Kiểm tra đơn hàng tối thiểu
        if (totalAmount < coupon.minOrderAmount) {
            return res.status(400).json({
                message: `Đơn hàng tối thiểu ${new Intl.NumberFormat("vi-VN").format(coupon.minOrderAmount)}₫ để áp dụng mã này`,
            });
        }

        // Tính toán giảm giá
        let discountAmount = 0;
        if (coupon.discountType === "percent") {
            discountAmount = Math.floor((totalAmount * coupon.discountValue) / 100);
            // Giới hạn max discount nếu có
            if (coupon.maxDiscountAmount && discountAmount > coupon.maxDiscountAmount) {
                discountAmount = Number(coupon.maxDiscountAmount);
            }
        } else {
            // fixed
            discountAmount = Number(coupon.discountValue);
        }

        // Đảm bảo giảm giá không vượt quá tổng đơn hàng
        if (discountAmount > totalAmount) {
            discountAmount = totalAmount;
        }

        const finalAmount = totalAmount - discountAmount;

        res.status(200).json({
            valid: true,
            couponCode: coupon.code,
            discountType: coupon.discountType,
            discountValue: Number(coupon.discountValue),
            discountAmount,
            finalAmount,
            message: `Giảm ${new Intl.NumberFormat("vi-VN").format(discountAmount)}₫`,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createCoupon,
    getAllCoupons,
    updateCoupon,
    deleteCoupon,
    getActiveCoupons,
    claimCoupon,
    getMyCoupons,
    deleteMyCoupon,
    applyCoupon,
};

const { Op } = require("sequelize");
const Coupon = require("../models/coupon");
const Discount = require("../models/discount");
const UserCoupon = require("../models/userCoupon");

const normalizeCode = (code) => String(code || "").trim().toUpperCase();

const deleteSyncedCoupons = async (where, transaction) => {
    const coupons = await Coupon.findAll({ where, transaction });
    const couponIds = coupons.map((coupon) => coupon.id);

    if (!couponIds.length) return 0;

    await UserCoupon.destroy({
        where: { couponId: { [Op.in]: couponIds } },
        transaction,
    });
    return Coupon.destroy({
        where: { id: { [Op.in]: couponIds } },
        transaction,
    });
};

const syncLegacyDiscountsToCoupons = async ({ code, transaction } = {}) => {
    const now = new Date();
    const where = {
        isActive: true,
        expiryDate: { [Op.gt]: now },
    };

    const normalizedCode = normalizeCode(code);
    if (normalizedCode) where.code = normalizedCode;

    const legacyDiscounts = await Discount.findAll({ where, transaction });

    if (!normalizedCode) {
        const legacyIds = legacyDiscounts.map((discount) => discount.id);
        await deleteSyncedCoupons(
            {
                sourceDiscountId: {
                    [Op.not]: null,
                    ...(legacyIds.length ? { [Op.notIn]: legacyIds } : {}),
                },
            },
            transaction,
        );
    }

    for (const discount of legacyDiscounts) {
        const couponCode = normalizeCode(discount.code);
        if (!couponCode) continue;

        const existingCoupon = await Coupon.findOne({
            where: { code: couponCode },
            transaction,
        });

        if (existingCoupon) {
            if (!existingCoupon.sourceDiscountId) {
                existingCoupon.sourceDiscountId = discount.id;
                existingCoupon.discountType = "percent";
                existingCoupon.discountValue = discount.percentage;
                existingCoupon.description = discount.description;
                existingCoupon.expiryDate = discount.expiryDate;
                existingCoupon.isActive = discount.isActive;
                await existingCoupon.save({ transaction });
            }
            continue;
        }

        await Coupon.create(
            {
                code: couponCode,
                description: discount.description,
                discountType: "percent",
                discountValue: discount.percentage,
                minOrderAmount: 0,
                maxDiscountAmount: null,
                usageLimit: null,
                usedCount: 0,
                startDate: discount.createdAt || now,
                expiryDate: discount.expiryDate,
                isActive: discount.isActive,
                sourceDiscountId: discount.id,
            },
            { transaction },
        );
    }
};

const deleteSyncedCouponForDiscount = async (discount, transaction) => {
    if (!discount) return 0;

    return deleteSyncedCoupons(
        {
            [Op.or]: [
                { sourceDiscountId: discount.id },
                { code: normalizeCode(discount.code), sourceDiscountId: null },
            ],
        },
        transaction,
    );
};

module.exports = { syncLegacyDiscountsToCoupons, deleteSyncedCouponForDiscount };

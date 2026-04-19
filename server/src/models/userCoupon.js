const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/connectSequelize");

const UserCoupon = sequelize.define(
    "UserCoupon",
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        userId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        couponId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        isUsed: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        usedAt: {
            type: DataTypes.DATE,
            allowNull: true,
        },
    },
    {
        timestamps: true,
    },
);

module.exports = UserCoupon;

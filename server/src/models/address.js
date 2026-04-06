const { DataTypes } = require("sequelize");
const sequelize = require("../config/connectSequelize").sequelize;

const Address = sequelize.define("Address", {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    recipientName: {
        type: DataTypes.STRING, // Tên người nhận (có thể khác tên tài khoản)
        allowNull: false,
    },
    phoneNumber: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    fullAddress: {
        type: DataTypes.STRING, // Địa chỉ chi tiết
        allowNull: false,
    },
    isDefault: {
        type: DataTypes.BOOLEAN, // Đánh dấu địa chỉ mặc định
        defaultValue: false,
    },
});

module.exports = Address;

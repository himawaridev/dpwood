const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/connectSequelize");
const AuditLog = sequelize.define("AuditLog", {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    action: {
        type: DataTypes.STRING, // Ví dụ: 'LOGIN', 'LOGOUT', 'REGISTER'
        allowNull: false,
    },
    details: {
        type: DataTypes.STRING, // Chi tiết thêm (nếu cần)
        allowNull: true,
    },
});

module.exports = AuditLog;

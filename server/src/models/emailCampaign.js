const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/connectSequelize");

const EmailCampaign = sequelize.define(
    "EmailCampaign",
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        audience: {
            type: DataTypes.ENUM("verified_users", "subscribers"),
            allowNull: false,
        },
        target: {
            type: DataTypes.ENUM("individual", "selected", "all"),
            allowNull: false,
        },
        recipientIds: {
            type: DataTypes.JSON,
            allowNull: true,
        },
        subject: {
            type: DataTypes.STRING(180),
            allowNull: false,
        },
        preview: {
            type: DataTypes.STRING(240),
            allowNull: true,
        },
        contentHtml: {
            type: DataTypes.TEXT("long"),
            allowNull: false,
        },
        status: {
            type: DataTypes.ENUM("queued", "processing", "completed", "failed", "cancelled"),
            allowNull: false,
            defaultValue: "queued",
        },
        totalRecipients: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            defaultValue: 0,
        },
        recipientSnapshotAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
        processedCount: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            defaultValue: 0,
        },
        sentCount: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            defaultValue: 0,
        },
        failedCount: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            defaultValue: 0,
        },
        cursorId: {
            type: DataTypes.STRING(64),
            allowNull: true,
        },
        cursorOffset: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            defaultValue: 0,
        },
        lastError: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        createdBy: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        startedAt: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        completedAt: {
            type: DataTypes.DATE,
            allowNull: true,
        },
    },
    {
        timestamps: true,
        indexes: [
            { fields: ["status", "createdAt"] },
            { fields: ["createdBy", "createdAt"] },
        ],
    },
);

module.exports = EmailCampaign;

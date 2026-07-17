const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/connectSequelize");

const NewsletterSubscriber = sequelize.define(
    "NewsletterSubscriber",
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        email: {
            type: DataTypes.STRING(254),
            allowNull: false,
            unique: true,
            validate: { isEmail: true },
        },
        status: {
            type: DataTypes.ENUM("pending", "subscribed", "unsubscribed"),
            allowNull: false,
            defaultValue: "pending",
        },
        verificationTokenHash: {
            type: DataTypes.STRING(64),
            allowNull: true,
        },
        verificationExpiresAt: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        verificationSentAt: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        verifiedAt: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        welcomeSentAt: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        unsubscribedAt: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        lastEmailSentAt: {
            type: DataTypes.DATE,
            allowNull: true,
        },
    },
    {
        timestamps: true,
        indexes: [
            { fields: ["status"] },
            { fields: ["verificationTokenHash"] },
            { fields: ["welcomeSentAt"] },
        ],
    },
);

module.exports = NewsletterSubscriber;

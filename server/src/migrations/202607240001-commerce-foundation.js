const { DataTypes } = require("sequelize");

const addColumnIfMissing = async (queryInterface, tableName, columnName, definition) => {
    const description = await queryInterface.describeTable(tableName);
    if (!description[columnName]) {
        await queryInterface.addColumn(tableName, columnName, definition);
    }
};

module.exports = {
    id: "202607240001-commerce-foundation",
    async up({ queryInterface }) {
        const existingTables = new Set(
            (await queryInterface.showAllTables()).map((table) =>
                typeof table === "string" ? table : table.tableName || table.name || Object.values(table)[0],
            ),
        );

        if (!existingTables.has("InventoryMovements")) {
            await queryInterface.createTable("InventoryMovements", {
                id: { type: DataTypes.UUID, primaryKey: true, allowNull: false },
                productId: { type: DataTypes.UUID, allowNull: false },
                orderId: { type: DataTypes.UUID, allowNull: true },
                actorId: { type: DataTypes.UUID, allowNull: true },
                variantId: { type: DataTypes.STRING(120), allowNull: true },
                type: { type: DataTypes.STRING(30), allowNull: false },
                quantity: { type: DataTypes.INTEGER, allowNull: false },
                stockAfter: { type: DataTypes.INTEGER, allowNull: false },
                reference: { type: DataTypes.STRING(160), allowNull: true },
                note: { type: DataTypes.STRING(500), allowNull: true },
                idempotencyKey: { type: DataTypes.STRING(180), allowNull: true },
                createdAt: { type: DataTypes.DATE, allowNull: false },
            });
            await queryInterface.addIndex("InventoryMovements", ["idempotencyKey"], {
                name: "inventory_movement_idempotency_unique",
                unique: true,
            });
            await queryInterface.addIndex("InventoryMovements", ["productId", "createdAt"], {
                name: "inventory_movement_product_created",
            });
        }

        if (!existingTables.has("Shipments")) {
            await queryInterface.createTable("Shipments", {
                id: { type: DataTypes.UUID, primaryKey: true, allowNull: false },
                orderId: { type: DataTypes.UUID, allowNull: false, unique: true },
                carrier: { type: DataTypes.STRING(100), allowNull: true },
                service: { type: DataTypes.STRING(100), allowNull: true },
                trackingCode: { type: DataTypes.STRING(120), allowNull: true },
                status: { type: DataTypes.STRING(30), allowNull: false, defaultValue: "READY" },
                shippingFee: { type: DataTypes.DECIMAL(15, 0), allowNull: false, defaultValue: 0 },
                estimatedDeliveryAt: { type: DataTypes.DATE, allowNull: true },
                shippedAt: { type: DataTypes.DATE, allowNull: true },
                deliveredAt: { type: DataTypes.DATE, allowNull: true },
                metadata: { type: DataTypes.JSON, allowNull: true },
                createdAt: { type: DataTypes.DATE, allowNull: false },
                updatedAt: { type: DataTypes.DATE, allowNull: false },
            });
        }

        if (!existingTables.has("ReturnRequests")) {
            await queryInterface.createTable("ReturnRequests", {
                id: { type: DataTypes.UUID, primaryKey: true, allowNull: false },
                orderId: { type: DataTypes.UUID, allowNull: false },
                userId: { type: DataTypes.UUID, allowNull: false },
                status: { type: DataTypes.STRING(30), allowNull: false, defaultValue: "REQUESTED" },
                reason: { type: DataTypes.STRING(100), allowNull: false },
                description: { type: DataTypes.TEXT, allowNull: true },
                images: { type: DataTypes.JSON, allowNull: true },
                refundAmount: { type: DataTypes.DECIMAL(15, 0), allowNull: false, defaultValue: 0 },
                resolutionNote: { type: DataTypes.TEXT, allowNull: true },
                reviewedById: { type: DataTypes.UUID, allowNull: true },
                reviewedAt: { type: DataTypes.DATE, allowNull: true },
                receivedAt: { type: DataTypes.DATE, allowNull: true },
                completedAt: { type: DataTypes.DATE, allowNull: true },
                createdAt: { type: DataTypes.DATE, allowNull: false },
                updatedAt: { type: DataTypes.DATE, allowNull: false },
            });
            await queryInterface.addIndex("ReturnRequests", ["orderId", "status"], {
                name: "return_request_order_status",
            });
        }

        if (!existingTables.has("AnalyticsEvents")) {
            await queryInterface.createTable("AnalyticsEvents", {
                id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
                eventName: { type: DataTypes.STRING(60), allowNull: false },
                userId: { type: DataTypes.UUID, allowNull: true },
                sessionId: { type: DataTypes.STRING(100), allowNull: true },
                path: { type: DataTypes.STRING(500), allowNull: true },
                properties: { type: DataTypes.JSON, allowNull: true },
                createdAt: { type: DataTypes.DATE, allowNull: false },
            });
            await queryInterface.addIndex("AnalyticsEvents", ["eventName", "createdAt"], {
                name: "analytics_event_name_created",
            });
        }

        if (!existingTables.has("AuthSessions")) {
            await queryInterface.createTable("AuthSessions", {
                id: { type: DataTypes.UUID, primaryKey: true, allowNull: false },
                userId: { type: DataTypes.UUID, allowNull: false },
                refreshTokenHash: { type: DataTypes.STRING(128), allowNull: false, unique: true },
                deviceLabel: { type: DataTypes.STRING(160), allowNull: true },
                ipAddress: { type: DataTypes.STRING(64), allowNull: true },
                lastUsedAt: { type: DataTypes.DATE, allowNull: false },
                expiresAt: { type: DataTypes.DATE, allowNull: false },
                revokedAt: { type: DataTypes.DATE, allowNull: true },
                createdAt: { type: DataTypes.DATE, allowNull: false },
                updatedAt: { type: DataTypes.DATE, allowNull: false },
            });
            await queryInterface.addIndex("AuthSessions", ["userId", "revokedAt", "lastUsedAt"], {
                name: "auth_session_user_active",
            });
        }

        if (!existingTables.has("CartRecoveries")) {
            await queryInterface.createTable("CartRecoveries", {
                id: { type: DataTypes.UUID, primaryKey: true, allowNull: false },
                userId: { type: DataTypes.UUID, allowNull: false, unique: true },
                items: { type: DataTypes.JSON, allowNull: false },
                subtotal: { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0 },
                lastActivityAt: { type: DataTypes.DATE, allowNull: false },
                lastRemindedAt: { type: DataTypes.DATE, allowNull: true },
                createdAt: { type: DataTypes.DATE, allowNull: false },
                updatedAt: { type: DataTypes.DATE, allowNull: false },
            });
            await queryInterface.addIndex("CartRecoveries", ["lastActivityAt", "lastRemindedAt"], {
                name: "cart_recovery_activity",
            });
        }

        const productColumns = {
            costPrice: { type: DataTypes.DECIMAL(15, 2), allowNull: true },
            packageWeightGrams: { type: DataTypes.INTEGER, allowNull: true },
            packageLengthCm: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
            packageWidthCm: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
            packageHeightCm: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
            googleProductCategory: { type: DataTypes.STRING(255), allowNull: true },
            seoTitle: { type: DataTypes.STRING(180), allowNull: true },
            seoDescription: { type: DataTypes.STRING(500), allowNull: true },
        };
        for (const [name, definition] of Object.entries(productColumns)) {
            await addColumnIfMissing(queryInterface, "Products", name, definition);
        }

        const orderColumns = {
            paymentStatus: {
                type: DataTypes.STRING(30),
                allowNull: false,
                defaultValue: "UNPAID",
            },
            fulfillmentStatus: {
                type: DataTypes.STRING(30),
                allowNull: false,
                defaultValue: "UNFULFILLED",
            },
            shippingFee: {
                type: DataTypes.DECIMAL(15, 0),
                allowNull: false,
                defaultValue: 0,
            },
            idempotencyKey: { type: DataTypes.STRING(180), allowNull: true },
            stockReservedAt: { type: DataTypes.DATE, allowNull: true },
            stockReservationExpiresAt: { type: DataTypes.DATE, allowNull: true },
        };
        for (const [name, definition] of Object.entries(orderColumns)) {
            await addColumnIfMissing(queryInterface, "Orders", name, definition);
        }

        const userColumns = {
            twoFactorEnabled: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
            twoFactorCodeHash: { type: DataTypes.STRING(128), allowNull: true },
            twoFactorExpiresAt: { type: DataTypes.DATE, allowNull: true },
        };
        for (const [name, definition] of Object.entries(userColumns)) {
            await addColumnIfMissing(queryInterface, "users", name, definition);
        }

        await addColumnIfMissing(queryInterface, "Wishlists", "priceWhenAdded", {
            type: DataTypes.DECIMAL(15, 2),
            allowNull: true,
        });
        await addColumnIfMissing(queryInterface, "Wishlists", "lastNotifiedPrice", {
            type: DataTypes.DECIMAL(15, 2),
            allowNull: true,
        });

        const orderIndexes = await queryInterface.showIndex("Orders");
        if (!orderIndexes.some((index) => index.name === "orders_idempotency_key_unique")) {
            await queryInterface.addIndex("Orders", ["idempotencyKey"], {
                name: "orders_idempotency_key_unique",
                unique: true,
            });
        }
    },
};

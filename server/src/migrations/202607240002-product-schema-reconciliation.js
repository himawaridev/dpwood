const { DataTypes } = require("sequelize");

const addColumnIfMissing = async (queryInterface, tableName, columnName, definition) => {
    const description = await queryInterface.describeTable(tableName);
    if (!description[columnName]) {
        await queryInterface.addColumn(tableName, columnName, definition);
    }
};

module.exports = {
    id: "202607240002-product-schema-reconciliation",
    async up({ queryInterface }) {
        const productColumns = {
            sku: { type: DataTypes.STRING(120), allowNull: true },
            gtin: { type: DataTypes.STRING(32), allowNull: true },
            mpn: { type: DataTypes.STRING(100), allowNull: true },
            images: { type: DataTypes.JSON, allowNull: true },
            variants: { type: DataTypes.JSON, allowNull: true },
            category: {
                type: DataTypes.STRING(255),
                allowNull: true,
                defaultValue: "cookware",
            },
            material: { type: DataTypes.STRING(255), allowNull: true },
            color: { type: DataTypes.STRING(255), allowNull: true },
            brand: { type: DataTypes.STRING(255), allowNull: true },
            capacity: { type: DataTypes.STRING(255), allowNull: true },
            dimensions: { type: DataTypes.STRING(150), allowNull: true },
            weight: { type: DataTypes.STRING(100), allowNull: true },
            warranty: { type: DataTypes.STRING(255), allowNull: true },
            origin: { type: DataTypes.STRING(255), allowNull: true },
            packageContents: { type: DataTypes.TEXT, allowNull: true },
            careInstructions: { type: DataTypes.TEXT, allowNull: true },
            safetyInstructions: { type: DataTypes.TEXT, allowNull: true },
            specifications: { type: DataTypes.JSON, allowNull: true },
            returnEligible: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: true,
            },
            returnWindowDays: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 7,
            },
            dishwasherSafe: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
            microwaveSafe: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
            isActive: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: true,
            },
            sold: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 0 },
            rating: {
                type: DataTypes.DECIMAL(3, 2),
                allowNull: false,
                defaultValue: 0,
            },
            ratingCount: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
        };

        for (const [name, definition] of Object.entries(productColumns)) {
            await addColumnIfMissing(queryInterface, "Products", name, definition);
        }

        const indexes = await queryInterface.showIndex("Products");
        if (!indexes.some((index) => index.name === "products_sku_unique")) {
            await queryInterface.addIndex("Products", ["sku"], {
                name: "products_sku_unique",
                unique: true,
            });
        }
        if (!indexes.some((index) => index.name === "products_active_category_created")) {
            await queryInterface.addIndex("Products", ["isActive", "category", "createdAt"], {
                name: "products_active_category_created",
            });
        }
    },
};

const { DataTypes, QueryTypes } = require("sequelize");

const normalizeTableName = (table) => {
    if (typeof table === "string") return table;
    return table.tableName || table.name || Object.values(table)[0];
};

const ensureIndex = async (queryInterface, tableName, fields, name, options = {}) => {
    try {
        const indexes = await queryInterface.showIndex(tableName);
        const normalizedFields = fields.map(String);
        const sameFieldIndexes = indexes.filter((index) => {
            const indexFields = (index.fields || []).map((field) => String(field.attribute || field.name));
            return indexFields.length === normalizedFields.length
                && indexFields.every((field, position) => field === normalizedFields[position]);
        });
        if (sameFieldIndexes.length) {
            const namedIndex = sameFieldIndexes.find((index) => index.name === name);
            if (namedIndex && sameFieldIndexes.some((index) => index.name !== name)) {
                await queryInterface.removeIndex(tableName, name);
                console.log(`Removed duplicate database index ${name}`);
            }
            return;
        }
        await queryInterface.addIndex(tableName, fields, { name, ...options });
        console.log(`Added database index ${name}`);
    } catch (error) {
        console.warn(`Index ${name} skipped: ${error.message}`);
    }
};

const migrateSellerRole = async (sequelize, queryInterface) => {
    try {
        const description = await queryInterface.describeTable("users");
        if (!String(description.role?.type || "").includes("seller")) return;

        await queryInterface.changeColumn("users", "role", {
            type: DataTypes.ENUM("root", "admin", "user", "seller", "staff"),
            allowNull: false,
            defaultValue: "user",
        });
        const [, metadata] = await sequelize.query("UPDATE users SET role = 'staff' WHERE role = 'seller'");
        await queryInterface.changeColumn("users", "role", {
            type: DataTypes.ENUM("root", "admin", "user", "staff"),
            allowNull: false,
            defaultValue: "user",
        });
        if (metadata?.affectedRows) console.log(`Migrated ${metadata.affectedRows} seller account(s) to staff`);
    } catch (error) {
        console.warn(`Role migration skipped: ${error.message}`);
    }
};

const migrateSupportTickets = async (sequelize, queryInterface, tableNames) => {
    if (!tableNames.has("SupportTickets")) return;

    const description = await queryInterface.describeTable("SupportTickets");
    if (description.topic && !String(description.topic.type || "").includes("PRODUCT")) {
        await queryInterface.changeColumn("SupportTickets", "topic", {
            type: DataTypes.ENUM("PAYMENT", "ORDER", "PRODUCT", "ACCOUNT", "OTHER"),
            allowNull: false,
        });
    }
    const columns = [
        ["description", { type: DataTypes.TEXT, allowNull: true }],
        ["resolutionNote", { type: DataTypes.TEXT, allowNull: true }],
        ["handlerType", { type: DataTypes.ENUM("NONE", "ADMIN", "AI"), allowNull: false, defaultValue: "NONE" }],
        ["lastHandledAt", { type: DataTypes.DATE, allowNull: true }],
    ];

    for (const [name, definition] of columns) {
        if (!description[name]) {
            await queryInterface.addColumn("SupportTickets", name, definition);
            console.log(`Added SupportTickets.${name}`);
        }
    }

    if (!tableNames.has("TicketMessages")) return;

    const messages = await sequelize.query(
        `SELECT id, ticketId, message, isAdmin, createdAt
         FROM TicketMessages
         ORDER BY ticketId ASC, createdAt ASC`,
        { type: QueryTypes.SELECT },
    );
    const summaries = new Map();

    for (const item of messages) {
        const summary = summaries.get(item.ticketId) || {};
        if (!item.isAdmin && !summary.description) summary.description = item.message;
        if (item.isAdmin) {
            summary.resolutionNote = item.message;
            summary.lastHandledAt = item.createdAt;
            summary.handlerType = /AI Support DPWOOD|AI DPWOOD/i.test(item.message || "") ? "AI" : "ADMIN";
        }
        summaries.set(item.ticketId, summary);
    }

    for (const [ticketId, summary] of summaries) {
        const updates = {};
        if (summary.description) updates.description = summary.description;
        if (summary.resolutionNote) {
            updates.resolutionNote = summary.resolutionNote;
            updates.handlerType = summary.handlerType;
            updates.lastHandledAt = summary.lastHandledAt;
        }
        if (Object.keys(updates).length) {
            const assignments = Object.keys(updates).map((key) => `\`${key}\` = :${key}`).join(", ");
            await sequelize.query(`UPDATE SupportTickets SET ${assignments} WHERE id = :ticketId`, {
                replacements: { ticketId, ...updates },
            });
        }
    }

    await queryInterface.dropTable("TicketMessages");
    console.log(`Archived ticket conversations into ${summaries.size} ticket(s) and removed TicketMessages`);
};

const optimizeDatabase = async (sequelize) => {
    const queryInterface = sequelize.getQueryInterface();
    const tableNames = new Set((await queryInterface.showAllTables()).map(normalizeTableName));

    await migrateSellerRole(sequelize, queryInterface);
    await migrateSupportTickets(sequelize, queryInterface, tableNames);

    const indexDefinitions = [
        ["Products", ["isActive", "category", "createdAt"], "idx_products_active_category_created"],
        ["Orders", ["userId", "createdAt"], "idx_orders_user_created"],
        ["Orders", ["status", "createdAt"], "idx_orders_status_created"],
        ["OrderItems", ["orderId"], "idx_order_items_order"],
        ["AuditLogs", ["userId", "createdAt"], "idx_audit_logs_user_created"],
        ["AuditLogs", ["action", "createdAt"], "idx_audit_logs_action_created"],
        ["SupportTickets", ["userId", "createdAt"], "idx_support_user_created"],
        ["SupportTickets", ["status", "createdAt"], "idx_support_status_created"],
        ["SupportTickets", ["orderCode"], "idx_support_order_code"],
    ];

    for (const [tableName, fields, name] of indexDefinitions) {
        if (tableNames.has(tableName)) await ensureIndex(queryInterface, tableName, fields, name);
    }
};

module.exports = { optimizeDatabase };

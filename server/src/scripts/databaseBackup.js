require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { QueryTypes } = require("sequelize");
const { sequelize } = require("../config/connectSequelize");

const backupDirectory = path.resolve(
    process.env.DB_BACKUP_DIR || path.join(__dirname, "..", "..", "backups"),
);
const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const outputPath = path.join(backupDirectory, `dpwood-${timestamp}.json`);

const normalizeTableName = (table) =>
    typeof table === "string"
        ? table
        : table.tableName || table.name || Object.values(table)[0];

const run = async () => {
    await sequelize.authenticate();
    const queryInterface = sequelize.getQueryInterface();
    const tableNames = (await queryInterface.showAllTables())
        .map(normalizeTableName)
        .filter(Boolean)
        .sort();
    const tables = [];

    for (const tableName of tableNames) {
        const quotedTable = queryInterface.queryGenerator.quoteTable(tableName);
        const rows = await sequelize.query(`SELECT * FROM ${quotedTable}`, {
            type: QueryTypes.SELECT,
        });
        tables.push({ name: tableName, rows });
    }

    const payload = {
        format: "dpwood-logical-backup",
        version: 1,
        createdAt: new Date().toISOString(),
        database: process.env.DB_NAME || null,
        tables,
    };

    fs.mkdirSync(backupDirectory, { recursive: true });
    fs.writeFileSync(outputPath, JSON.stringify(payload, null, 2), {
        encoding: "utf8",
        flag: "wx",
    });
    console.log(`Database backup created: ${outputPath}`);
};

run()
    .catch((error) => {
        console.error(`Database backup failed: ${error.message}`);
        process.exitCode = 1;
    })
    .finally(() => sequelize.close());

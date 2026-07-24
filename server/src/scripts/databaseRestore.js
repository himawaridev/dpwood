require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { sequelize } = require("../config/connectSequelize");

const fileArgument = process.argv.find((argument) => argument.startsWith("--file="));
const confirmed = process.argv.includes("--confirm");
const sourcePath = fileArgument ? path.resolve(fileArgument.slice("--file=".length)) : "";

if (!sourcePath || !fs.existsSync(sourcePath)) {
    console.error("Usage: pnpm db:restore -- --file=C:\\backup.json --confirm");
    process.exit(1);
}
if (!confirmed) {
    console.error(
        "Restore is destructive. Re-run with --confirm after verifying the target database.",
    );
    process.exit(1);
}

const readBackup = () => {
    const payload = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
    if (
        payload?.format !== "dpwood-logical-backup" ||
        payload?.version !== 1 ||
        !Array.isArray(payload.tables)
    ) {
        throw new Error("Unsupported or invalid DPWOOD backup file.");
    }
    for (const table of payload.tables) {
        if (!table?.name || !Array.isArray(table.rows)) {
            throw new Error("Backup contains an invalid table entry.");
        }
    }
    return payload;
};

const normalizeTableName = (table) =>
    typeof table === "string" ? table : table.tableName || table.name || Object.values(table)[0];

const run = async () => {
    const payload = readBackup();
    await sequelize.authenticate();
    const queryInterface = sequelize.getQueryInterface();
    const existingTables = new Set(
        (await queryInterface.showAllTables()).map(normalizeTableName).filter(Boolean),
    );
    const restorableTables = payload.tables.filter((table) => existingTables.has(table.name));
    const transaction = await sequelize.transaction();

    try {
        await sequelize.query("SET FOREIGN_KEY_CHECKS = 0", { transaction });
        for (const table of [...restorableTables].reverse()) {
            await queryInterface.bulkDelete(table.name, null, { transaction });
        }
        for (const table of restorableTables) {
            if (table.rows.length) {
                await queryInterface.bulkInsert(table.name, table.rows, { transaction });
            }
        }
        await sequelize.query("SET FOREIGN_KEY_CHECKS = 1", { transaction });
        await transaction.commit();
        console.log(
            `Database restored from ${sourcePath}: ${restorableTables.length} tables, ` +
                `${restorableTables.reduce((sum, table) => sum + table.rows.length, 0)} rows.`,
        );
    } catch (error) {
        if (!transaction.finished) {
            try {
                await sequelize.query("SET FOREIGN_KEY_CHECKS = 1", { transaction });
            } catch {
                // The transaction connection will be discarded if it cannot be recovered.
            }
            await transaction.rollback();
        }
        throw error;
    }
};

run()
    .catch((error) => {
        console.error(`Database restore failed: ${error.message}`);
        process.exitCode = 1;
    })
    .finally(() => sequelize.close());

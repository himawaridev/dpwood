const fs = require("fs");
const path = require("path");
const { QueryTypes } = require("sequelize");

const migrationsDirectory = path.join(__dirname, "..", "migrations");

const ensureMigrationTable = async (sequelize) => {
    await sequelize.query(`
        CREATE TABLE IF NOT EXISTS SchemaMigrations (
            id VARCHAR(190) NOT NULL PRIMARY KEY,
            appliedAt DATETIME NOT NULL
        )
    `);
};

const loadMigrations = () =>
    fs
        .readdirSync(migrationsDirectory)
        .filter((fileName) => fileName.endsWith(".js"))
        .sort()
        .map((fileName) => require(path.join(migrationsDirectory, fileName)));

const getAppliedMigrationIds = async (sequelize) => {
    const rows = await sequelize.query("SELECT id FROM SchemaMigrations ORDER BY id", {
        type: QueryTypes.SELECT,
    });
    return new Set(rows.map((row) => row.id));
};

const runMigrations = async (sequelize) => {
    await ensureMigrationTable(sequelize);
    const appliedIds = await getAppliedMigrationIds(sequelize);
    const queryInterface = sequelize.getQueryInterface();

    for (const migration of loadMigrations()) {
        if (!migration.id || typeof migration.up !== "function") {
            throw new Error("Migration must export an id and up function.");
        }
        if (appliedIds.has(migration.id)) continue;

        await migration.up({ sequelize, queryInterface });
        await sequelize.query(
            "INSERT INTO SchemaMigrations (id, appliedAt) VALUES (:id, :appliedAt)",
            { replacements: { id: migration.id, appliedAt: new Date() } },
        );
        console.log(`Applied migration ${migration.id}`);
    }
};

module.exports = { runMigrations, loadMigrations, getAppliedMigrationIds };

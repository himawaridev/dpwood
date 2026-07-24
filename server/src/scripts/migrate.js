require("dotenv").config();
const { sequelize } = require("../config/connectSequelize");
const { runMigrations } = require("../services/migrationService");

const main = async () => {
    await sequelize.authenticate();
    await runMigrations(sequelize);
    console.log("Database migrations are up to date.");
};

main()
    .catch((error) => {
        console.error("Migration failed:", error.message);
        process.exitCode = 1;
    })
    .finally(() => sequelize.close());

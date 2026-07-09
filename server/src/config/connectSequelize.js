const { Sequelize } = require("sequelize");
require("dotenv").config();

const isSSL = process.env.DB_SSL === "true";

const sequelize = new Sequelize(
    process.env.DB_NAME || "dpwood_db",
    process.env.DB_USER || "root",
    process.env.DB_PASSWORD || "",
    {
        host: process.env.DB_HOST || "localhost",
        dialect: "mysql",
        port: process.env.DB_PORT || 3306,
        logging: false,
        timezone: "+07:00",
        ...(isSSL && {
            dialectOptions: {
                ssl: {
                    minVersion: "TLSv1.2",
                    rejectUnauthorized: true,
                },
            },
        }),
    },
);

const connectDB = async () => {
    await sequelize.authenticate();
    console.log("Connect database successfully");
};

module.exports = {
    sequelize,
    connectDB,
};

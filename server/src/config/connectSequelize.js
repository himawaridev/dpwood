const { Sequelize } = require("sequelize");
require("dotenv").config();

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
    host: process.env.DB_HOST || "localhost",
    dialect: "mysql",
    port: process.env.DB_PORT || 3306,
    logging: false,
});

const connectDB = async () => {
    try {
        await sequelize.authenticate();
        console.log("Connect database succesfully");
    } catch (error) {
        console.log("Cannot connected database", error);
        process.exit(1);
    }
};

module.exports = {
    sequelize,
    connectDB,
};

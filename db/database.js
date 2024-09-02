const { Sequelize } = require('sequelize');
const { dbName, dbHost, dbPort, dbUname, dbPassword } = require('../config.json');

const sequelize = new Sequelize(dbName, dbUname, dbPassword, {
    host: dbHost,
    port: dbPort,
    dialect: 'mysql',
    logging: false
});

sequelize.authenticate()
    .then(() => {
        console.log('Connected to database!');
    })
    .catch(err => {
        console.error('Unable to connect to the database:', err);
    });

module.exports = sequelize;

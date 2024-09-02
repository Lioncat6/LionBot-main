const { DataTypes } = require('sequelize');
const sequelize = require('./database');

const Guild = sequelize.define('Guild', {
    discordId: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    ngguildstatsenabled: {
        type: DataTypes.BOOLEAN,
        allowNull: true
    },
    ngguildmemberschannel: {
        type: DataTypes.STRING,
        allowNull: true
    },
    ngonlinememberschannel: {
        type: DataTypes.STRING,
        allowNull: true
    },
    nggxpchannel:{
        type: DataTypes.STRING,
        allowNull: true
    },
    nglevelchannel:{
        type: DataTypes.STRING,
        allowNull: true
    },
    ngrankchannel:{
        type: DataTypes.STRING,
        allowNull: true
    },
    nggxptonextlevelchannel:{
        type: DataTypes.STRING,
        allowNull: true
    },
    ngguildname: {
        type: DataTypes.STRING,
        allowNull: true
    }
});

module.exports = Guild;

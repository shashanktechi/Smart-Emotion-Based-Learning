const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Content = sequelize.define('Content', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    title: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: false },
    type: { type: DataTypes.ENUM('video', 'text', 'quiz'), allowNull: false },
    difficulty: { type: DataTypes.INTEGER, allowNull: false },
    emotion_trigger: { type: DataTypes.STRING, allowNull: true },
    youtube_url: { type: DataTypes.STRING, allowNull: true }
}, {
    tableName: 'content_modules',
    timestamps: true
});

module.exports = Content;

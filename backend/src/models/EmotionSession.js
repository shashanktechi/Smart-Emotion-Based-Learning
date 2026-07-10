const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');

const EmotionSession = sequelize.define('EmotionSession', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: { 
        type: DataTypes.INTEGER, 
        allowNull: false,
        references: { model: User, key: 'id' }
    },
    start_time: { type: DataTypes.DATE, allowNull: false },
    end_time: { type: DataTypes.DATE, allowNull: true },
    average_focus_score: { type: DataTypes.FLOAT, allowNull: true }
}, {
    tableName: 'emotion_sessions',
    timestamps: false
});

User.hasMany(EmotionSession, { foreignKey: 'user_id' });
EmotionSession.belongsTo(User, { foreignKey: 'user_id' });

module.exports = EmotionSession;

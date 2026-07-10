const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');
const EmotionSession = require('./EmotionSession');

const EmotionMinute = sequelize.define('EmotionMinute', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: { 
        type: DataTypes.INTEGER, 
        allowNull: false,
        references: { model: User, key: 'id' }
    },
    session_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: EmotionSession, key: 'id' }
    },
    minute_bucket: { type: DataTypes.DATE, allowNull: false },
    dominant_emotion: { type: DataTypes.STRING, allowNull: false },
    avg_confidence: { type: DataTypes.FLOAT, allowNull: false }
}, {
    tableName: 'emotion_minutes',
    timestamps: false,
    indexes: [
        { unique: false, fields: ['user_id', 'minute_bucket'] }
    ]
});

EmotionSession.hasMany(EmotionMinute, { foreignKey: 'session_id' });
EmotionMinute.belongsTo(EmotionSession, { foreignKey: 'session_id' });

module.exports = EmotionMinute;

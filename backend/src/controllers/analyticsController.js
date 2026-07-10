const EmotionMinute = require('../models/EmotionMinute');
const EmotionSession = require('../models/EmotionSession');
const User = require('../models/User');
const { fn, col } = require('sequelize');

exports.logEmotion = async (req, res) => {
    try {
        const { session_id, minute_bucket, dominant_emotion, avg_confidence } = req.body;
        const user_id = req.user.id;
        
        let activeSessionId = session_id;
        
        // Find or create active session to prevent FK errors
        let session = null;
        if (activeSessionId) {
            session = await EmotionSession.findByPk(activeSessionId);
        }
        
        if (!session) {
            // Find latest open session
            session = await EmotionSession.findOne({
                where: { user_id, end_time: null },
                order: [['start_time', 'DESC']]
            });
            
            // If none, create a new one
            if (!session) {
                session = await EmotionSession.create({
                    user_id,
                    start_time: new Date()
                });
            }
            activeSessionId = session.id;
        }
        
        const record = await EmotionMinute.create({
            user_id,
            session_id: activeSessionId,
            minute_bucket,
            dominant_emotion,
            avg_confidence
        });
        res.status(201).json(record);
    } catch (err) {
        console.error('Failed to log aggregated emotion:', err);
        res.status(500).json({ error: 'Failed to log aggregated emotion' });
    }
};

exports.getDashboardStats = async (req, res) => {
    try {
        const user_id = req.user.id;
        // Fetch recent minutes
        const minutes = await EmotionMinute.findAll({
            where: { user_id },
            order: [['minute_bucket', 'DESC']],
            limit: 60 // Last 60 minutes
        });
        res.json(minutes);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch dashboard stats' });
    }
};

exports.getAdminSummary = async (req, res) => {
    try {
        const totalUsers = await User.count();
        const totalSessions = await EmotionSession.count();
        const totalMinutes = await EmotionMinute.count();

        // Get count per dominant emotion
        const emotionCounts = await EmotionMinute.findAll({
            attributes: [
                'dominant_emotion',
                [fn('COUNT', col('id')), 'count']
            ],
            group: ['dominant_emotion']
        });

        // Get timeline data for charts
        const timeline = await EmotionMinute.findAll({
            attributes: [
                'minute_bucket',
                'dominant_emotion',
                [fn('COUNT', col('id')), 'count']
            ],
            group: ['minute_bucket', 'dominant_emotion'],
            order: [['minute_bucket', 'ASC']],
            limit: 100
        });

        res.json({
            summary: {
                totalUsers,
                totalSessions,
                totalMinutes
            },
            emotionDistribution: emotionCounts,
            timeline
        });
    } catch (err) {
        console.error('Get admin summary error:', err);
        res.status(500).json({ error: 'Server error fetching admin stats' });
    }
};

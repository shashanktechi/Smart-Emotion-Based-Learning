const Content = require('../models/Content');
const { Op } = require('sequelize');

exports.getAdaptiveContent = async (req, res) => {
    try {
        const { emotion } = req.query; // 'confusion', 'boredom', 'focus', 'happiness', 'frustration', 'surprise'
        
        let trigger = null;
        if (['confusion', 'boredom', 'happiness', 'frustration', 'surprise'].includes(emotion)) {
            trigger = emotion;
        }

        const query = trigger 
            ? { where: { emotion_trigger: trigger } }
            : { where: { emotion_trigger: { [Op.is]: null } } }; // Default track

        const contents = await Content.findAll(query);
        
        if (contents.length > 0) {
            const selected = contents[Math.floor(Math.random() * contents.length)];
            res.json(selected);
        } else {
            res.status(404).json({ error: 'No matching content found for this state.' });
        }
    } catch (err) {
        res.status(500).json({ error: 'Server error fetching content' });
    }
};

exports.getAllContent = async (req, res) => {
    try {
        const contents = await Content.findAll({
            order: [['createdAt', 'DESC']]
        });
        res.json(contents);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch content modules' });
    }
};

exports.createContent = async (req, res) => {
    try {
        const { title, description, type, difficulty, emotion_trigger, youtube_url } = req.body;
        if (!title || !description || !type || !difficulty) {
            return res.status(400).json({ error: 'Missing required content fields' });
        }
        const newContent = await Content.create({
            title,
            description,
            type,
            difficulty,
            emotion_trigger: emotion_trigger || null,
            youtube_url: youtube_url || null
        });
        res.status(201).json(newContent);
    } catch (err) {
        res.status(500).json({ error: 'Failed to create content module' });
    }
};

exports.deleteContent = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await Content.destroy({ where: { id } });
        if (deleted) {
            res.json({ message: 'Content module deleted successfully' });
        } else {
            res.status(404).json({ error: 'Content module not found' });
        }
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete content module' });
    }
};

exports.updateContent = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, type, difficulty, emotion_trigger, youtube_url } = req.body;
        
        const content = await Content.findByPk(id);
        if (!content) return res.status(404).json({ error: 'Content module not found' });
        
        content.title = title !== undefined ? title : content.title;
        content.description = description !== undefined ? description : content.description;
        content.type = type !== undefined ? type : content.type;
        content.difficulty = difficulty !== undefined ? parseInt(difficulty, 10) : content.difficulty;
        content.emotion_trigger = emotion_trigger !== undefined 
            ? (emotion_trigger === 'none' ? null : emotion_trigger) 
            : content.emotion_trigger;
        content.youtube_url = youtube_url !== undefined ? (youtube_url === '' ? null : youtube_url) : content.youtube_url;
            
        await content.save();
        res.json(content);
    } catch (err) {
        console.error('Update content error:', err);
        res.status(500).json({ error: 'Failed to update content module' });
    }
};

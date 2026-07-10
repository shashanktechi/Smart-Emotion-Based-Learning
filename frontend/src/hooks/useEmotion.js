import { useState, useCallback } from 'react';
import flaskClient from '../api/flaskClient';
import nodeClient from '../api/nodeClient';

export const useEmotion = () => {
    const [currentEmotion, setCurrentEmotion] = useState('focus');
    const [isPredicting, setIsPredicting] = useState(false);

    const predictEmotion = useCallback(async (base64Image) => {
        setIsPredicting(true);
        try {
            const res = await flaskClient.post('/predict', { image: base64Image });
            const emotion = res.data.emotion || 'focus';
            setCurrentEmotion(emotion);
            
            // Log to Node Backend bucket
            await nodeClient.post('/analytics', {
                session_id: 1, // Mock session id for now
                minute_bucket: new Date().toISOString().slice(0, 16) + ':00.000Z',
                dominant_emotion: emotion,
                avg_confidence: res.data.confidence || 0.9
            }).catch(e => console.error("Analytics log failed:", e));

        } catch (err) {
            console.error("Flask API Prediction failed. Defaulting to 'focus'.", err);
            setCurrentEmotion('focus'); // Fallback Strategy
        } finally {
            setIsPredicting(false);
        }
    }, []);

    return { currentEmotion, isPredicting, predictEmotion };
};

import { useEffect, useRef, useState } from 'react';
import { resizeAndGetBase64 } from '../utils/imageHelpers';

export const useWebcam = (intervalMs = 5000, onFrameCaptured) => {
    const videoRef = useRef(null);
    const [isStreaming, setIsStreaming] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        let stream = null;
        let interval = null;

        const startWebcam = async () => {
            try {
                stream = await navigator.mediaDevices.getUserMedia({ video: true });
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    setIsStreaming(true);
                    setError(null);
                }

                interval = setInterval(() => {
                    if (videoRef.current && videoRef.current.readyState === 4) {
                        const base64Image = resizeAndGetBase64(videoRef.current, 224, 224);
                        if (onFrameCaptured) {
                            onFrameCaptured(base64Image);
                        }
                    }
                }, intervalMs);
            } catch (err) {
                console.error("Error accessing webcam:", err);
                setError(err.name || 'Error');
                setIsStreaming(false);
            }
        };

        startWebcam();

        return () => {
            if (interval) clearInterval(interval);
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [intervalMs, onFrameCaptured]);

    return { videoRef, isStreaming, error };
};

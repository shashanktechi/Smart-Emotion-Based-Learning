export const resizeAndGetBase64 = (videoElement, width = 224, height = 224) => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    
    // Draw and resize the video frame onto the canvas
    ctx.drawImage(videoElement, 0, 0, width, height);
    
    return canvas.toDataURL('image/jpeg', 0.8);
};

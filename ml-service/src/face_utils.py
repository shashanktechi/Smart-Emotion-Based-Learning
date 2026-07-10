import os
import urllib.request
import cv2
import numpy as np

# Resolve local path for the Haar Cascade file
cascade_name = 'haarcascade_frontalface_default.xml'
cascade_path = os.path.join(os.path.dirname(__file__), cascade_name)

# Self-healing download of the Haar Cascade XML if not present locally
if not os.path.exists(cascade_path):
    print(f"[face_utils] Haar Cascade XML not found locally. Downloading from official OpenCV repository...")
    url = f"https://raw.githubusercontent.com/opencv/opencv/master/data/haarcascades/{cascade_name}"
    try:
        # Create parent directories if they do not exist
        os.makedirs(os.path.dirname(cascade_path), exist_ok=True)
        urllib.request.urlretrieve(url, cascade_path)
        print(f"[face_utils] Download complete. Saved to: {cascade_path}")
    except Exception as e:
        print(f"[face_utils] Failed to download cascade: {e}")

# Load the cascade classifier
face_cascade = cv2.CascadeClassifier(cascade_path)
if face_cascade.empty():
    print(f"[face_utils] ERROR: Failed to load Haar Cascade classifier from {cascade_path}")

def get_face_crop(image: np.ndarray, target_size=(48, 48)):
    """
    Detects the largest face using OpenCV Haar Cascades and crops it.
    Falls back to a center crop if no face is detected or if classifier fails.
    """
    try:
        if not face_cascade.empty():
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            faces = face_cascade.detectMultiScale(gray, 1.1, 5, minSize=(30, 30))
            
            if len(faces) > 0:
                # Get the largest face by area
                x, y, w, h = max(faces, key=lambda rect: rect[2] * rect[3])
                
                # Crop with slight padding (10%)
                pad_w = int(w * 0.1)
                pad_h = int(h * 0.1)
                
                y_start = max(0, y - pad_h)
                y_end = min(image.shape[0], y + h + pad_h)
                x_start = max(0, x - pad_w)
                x_end = min(image.shape[1], x + w + pad_w)
                
                face_crop = gray[y_start:y_end, x_start:x_end]
                return cv2.resize(face_crop, target_size)
                
    except Exception as e:
        print(f"[face_utils] Haar Cascade face detection failed: {e}")
        
    # Fallback to center crop
    try:
        h, w = image.shape[:2]
        size = min(h, w)
        y = (h - size) // 2
        x = (w - size) // 2
        face_crop = image[y:y+size, x:x+size]
        face_gray = cv2.cvtColor(face_crop, cv2.COLOR_BGR2GRAY)
        return cv2.resize(face_gray, target_size)
    except Exception as e:
        print(f"[face_utils] Center crop fallback failed: {e}")
        return None

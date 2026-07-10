import os

try:
    import tensorflow as tf
    from tensorflow.keras.models import Sequential
    from tensorflow.keras.layers import Conv2D, MaxPooling2D, Dense, Flatten, Dropout
    TF_AVAILABLE = True
except ImportError:
    TF_AVAILABLE = False

def build_model():
    """Builds a standard CNN for 48x48 grayscale inputs."""
    if not TF_AVAILABLE:
        return None
    model = Sequential([
        Conv2D(32, (3, 3), activation='relu', input_shape=(48, 48, 1)),
        MaxPooling2D((2, 2)),
        Conv2D(64, (3, 3), activation='relu'),
        MaxPooling2D((2, 2)),
        Conv2D(128, (3, 3), activation='relu'),
        MaxPooling2D((2, 2)),
        Flatten(),
        Dense(128, activation='relu'),
        Dropout(0.5),
        Dense(7, activation='softmax') # Assuming FER2013 7 classes
    ])
    return model

def get_model():
    model_path = os.path.join(os.path.dirname(__file__), '..', 'models', 'emotion_model.h5')
    model = build_model()
    # In a real scenario, we would download or load the pretrained weights here.
    # if os.path.exists(model_path):
    #     model.load_weights(model_path)
    # else:
    #     print("Warning: Pretrained weights not found. Using initialized weights for mock.")
    return model

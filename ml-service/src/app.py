import os
import pathlib
from dotenv import load_dotenv

# Load .env from the ml-service directory (parent of src/)
_env_path = pathlib.Path(__file__).resolve().parent.parent / '.env'
load_dotenv(_env_path)

import base64
import numpy as np
import cv2
from flask import Flask, request, jsonify
from flask_cors import CORS
from jose import jwt, JWTError
from src.predict import preprocess_and_predict
from functools import wraps

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

JWT_SECRET = os.environ.get('JWT_SECRET', 'super-secret-key-shared-between-node-and-flask')
ALGORITHM = "HS256"

print(f"[Flask ML] JWT_SECRET loaded: {'YES' if JWT_SECRET else 'NO'} (length={len(JWT_SECRET)})")

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith("Bearer "):
            return jsonify({"error": "Missing or invalid Authorization header"}), 401
        
        token = auth_header.split(" ")[1]
        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=[ALGORITHM])
            request.user = payload
        except JWTError as e:
            print(f"[Flask ML] JWT Error: {str(e)}")
            return jsonify({"error": f"Invalid token: {str(e)}"}), 401
        return f(*args, **kwargs)
    return decorated

def decode_base64_image(b64_string):
    if ',' in b64_string:
        b64_string = b64_string.split(',')[1]
    img_data = base64.b64decode(b64_string)
    nparr = np.frombuffer(img_data, np.uint8)
    return cv2.imdecode(nparr, cv2.IMREAD_COLOR)

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy", "service": "flask_ml"}), 200

@app.route('/predict', methods=['POST'])
@token_required
def predict():
    data = request.json
    if not data or 'image' not in data:
        return jsonify({"error": "No image provided"}), 400
        
    try:
        img = decode_base64_image(data['image'])
        result = preprocess_and_predict(img)
        if "error" in result:
            return jsonify(result), 400
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000)

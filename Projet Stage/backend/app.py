# backend/app.py
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from extensions import db
from models import User
import os
import subprocess
import json

app = Flask(__name__)
CORS(app)

# === Configuration ===
basedir = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'users.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

UPLOAD_FOLDER = os.path.join(os.getcwd(), 'uploads')
RESULT_FOLDER = os.path.join(os.getcwd(), 'static', 'results')

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(RESULT_FOLDER, exist_ok=True)

# Init db
db.init_app(app)
with app.app_context():
    db.create_all()

@app.route('/')
def index():
    return "✅ Flask backend is running!"

# === SIGNUP ===
@app.route('/signup', methods=['POST'])
def signup():
    data = request.get_json()
    if not data or 'email' not in data or 'password' not in data or 'full_name' not in data:
        return jsonify({'message': 'Missing fields'}), 400

    full_name = data['full_name']
    email = data['email']
    password = generate_password_hash(data['password'])

    if User.query.filter_by(email=email).first():
        return jsonify({'message': 'User already exists'}), 409

    new_user = User(full_name=full_name, email=email, password=password)
    db.session.add(new_user)
    db.session.commit()
    return jsonify({'message': 'User created successfully'}), 201

# === LOGIN ===
@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    if not data or 'email' not in data or 'password' not in data:
        return jsonify({'message': 'Missing fields'}), 400

    email = data['email']
    password = data['password']
    user = User.query.filter_by(email=email).first()

    if not user or not check_password_hash(user.password, password):
        return jsonify({'message': 'Invalid credentials'}), 401

    return jsonify({'message': 'Login successful', 'user': {'name': user.full_name, 'email': user.email}})

# === RUN DETECTION ===
@app.route('/run-detection', methods=['POST'])
def run_detection():
    if 'video' not in request.files:
        return jsonify({'error': 'No video uploaded'}), 400

    video = request.files['video']
    upload_path = os.path.join(UPLOAD_FOLDER, video.filename)
    video.save(upload_path)

    output_path = os.path.join(RESULT_FOLDER, 'output.mp4')
    stats_path = os.path.join(RESULT_FOLDER, 'output_stats.json')

    script_path = r"C:\Users\DELL\Desktop\VisioTrack\People-Count-using-YOLOv8\main2.py"

    try:
        result = subprocess.run(
            ['python', script_path, '--input', upload_path, '--output', output_path, '--stats', stats_path],
            capture_output=True, text=True
        )

        if result.returncode != 0:
            return jsonify({'error': f"Script failed: {result.stderr}"}), 500

        if not os.path.exists(output_path):
            return jsonify({'error': 'Output video not found'}), 500

        with open(stats_path, 'r') as f:
            stats = json.load(f)

        return jsonify({
            'video_url': f'http://localhost:5000/static/results/output.mp4',
            'stats': stats
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

# === Serve Result Files ===
@app.route('/static/results/<filename>')
def serve_result(filename):
    return send_from_directory(RESULT_FOLDER, filename)

if __name__ == '__main__':
    app.run(debug=True, port=5000)

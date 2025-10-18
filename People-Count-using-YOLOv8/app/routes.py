import os
from flask import Blueprint, render_template, request, redirect, url_for, session, send_from_directory
from werkzeug.utils import secure_filename
from .utils import run_people_counter

main = Blueprint('main', __name__)
UPLOAD_FOLDER = 'app/static/uploads'
RESULT_FOLDER = 'app/static/results'

@main.route('/')
def home():
    return redirect(url_for('main.login'))

@main.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        if request.form['email'] == 'admin@gmail.com' and request.form['password'] == 'admin123':
            session['logged_in'] = True
            return redirect(url_for('main.dashboard'))
    return render_template('login.html')

@main.route('/dashboard', methods=['GET', 'POST'])
def dashboard():
    if not session.get('logged_in'):
        return redirect(url_for('main.login'))

    if request.method == 'POST':
        video = request.files['video']
        if video:
            filename = secure_filename(video.filename)
            input_path = os.path.join(UPLOAD_FOLDER, filename)
            output_path = os.path.join(RESULT_FOLDER, 'output.mp4')
            video.save(input_path)
            run_people_counter(input_path, output_path)
            return redirect(url_for('main.result'))

    return render_template('dashboard.html')

@main.route('/result')
def result():
    if not session.get('logged_in'):
        return redirect(url_for('main.login'))

    with open('app/static/output_stats.json', 'r') as f:
        import json
        stats = json.load(f)

    return render_template('result.html', stats=stats)

@main.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('main.login'))

import os
import requests
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from models import db, Consultant, LeaveRequest
from ResumeAgent import local_resume_check
from datetime import datetime, timedelta

# --- SETUP ---
app = Flask(__name__)
CORS(app)
UPLOAD_FOLDER = 'temp_uploads'
if not os.path.exists(UPLOAD_FOLDER): os.makedirs(UPLOAD_FOLDER)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///database.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)

# --- OLLAMA API CONFIGURATION ---
OLLAMA_API_URL = "http://localhost:11434/api/embeddings"
OLLAMA_MODEL = "nomic-embed-text"

# --- DATABASE INITIALIZATION ---
with app.app_context():
    db.create_all()
    if Consultant.query.count() == 0:
        print("Populating database with updated defaults for opportunities...")
        hashed_password = generate_password_hash('1234', method='pbkdf2:sha256')
        consultants_data = [
            {"name": "Arjun Kumar", "resume": "Experienced Python developer with skills in Flask, Django, and SQL databases.", "opportunities": 2},
            {"name": "Sneha Sharma", "resume": "Frontend specialist with expertise in React, Redux, and modern CSS.", "opportunities": 3},
            {"name": "Ravi Singh", "resume": "Full-stack engineer proficient in JavaScript, Node.js, and Express.", "opportunities": 1},
            {"name": "Meena Patel", "resume": "Data Scientist skilled in Python, Pandas, and Scikit-learn.", "opportunities": 0},
            {"name": "Vikram Rathod", "resume": "DevOps engineer with a background in CI/CD pipelines using Jenkins and Docker.", "opportunities": 2},
            {"name": "Priya Desai", "resume": "Quality Assurance tester with a focus on automated testing using Selenium and Cypress.", "opportunities": 1},
            {"name": "Amit Verma", "resume": "Java developer with experience in Spring Boot and microservices architecture.", "opportunities": 3},
            {"name": "Anjali Mehta", "resume": "Project Manager with PMP certification, expert in Agile teams.", "opportunities": 0},
            {"name": "Rajesh Gupta", "resume": "Cybersecurity analyst focused on network security and vulnerability assessment.", "opportunities": 2},
            {"name": "Sunita Reddy", "resume": "Cloud architect specializing in AWS solutions, including Lambda and RDS.", "opportunities": 1}
        ]
        for data in consultants_data:
            username = data["name"].split(" ")[0].lower()
            consultant = Consultant(name=data["name"], username=username, password_hash=hashed_password, resume_text=data["resume"], resume_status='Updated', opportunities=data["opportunities"])
            db.session.add(consultant)
        db.session.commit()
        print("Database populated.")

# --- HELPER FUNCTIONS ---
def get_ollama_embedding(text):
    try:
        payload = {"model": OLLAMA_MODEL, "prompt": text}; response = requests.post(OLLAMA_API_URL, json=payload); response.raise_for_status(); return response.json()["embedding"]
    except requests.exceptions.RequestException as e: print(f"Error calling Ollama API: {e}"); return None
def cosine_similarity(v1, v2): return np.dot(v1, v2) / (np.linalg.norm(v1) * np.linalg.norm(v2))

# --- API ENDPOINTS ---

@app.route("/admin/login", methods=["POST"])
def admin_login():
    password = request.json.get('password');
    if password == "admin": return jsonify({"message": "Admin login successful"}), 200
    return jsonify({"error": "Invalid admin password"}), 401

@app.route("/login", methods=["POST"])
def consultant_login():
    data = request.json; username, password = data.get('username'), data.get('password')
    consultant = Consultant.query.filter_by(username=username.lower()).first()
    if consultant and check_password_hash(consultant.password_hash, password): return jsonify(consultant.to_dict())
    return jsonify({"error": "Invalid credentials"}), 401

@app.route("/consultants/<int:id>", methods=["GET", "PUT", "DELETE"])
def handle_consultant(id):
    consultant = Consultant.query.get_or_404(id)
    if request.method == 'GET': return jsonify(consultant.to_dict())
    if request.method == 'PUT':
        data = request.json; consultant.name = data.get('name', consultant.name); consultant.username = data.get('username', consultant.username).lower(); consultant.resume_text = data.get('resume_text', consultant.resume_text); consultant.resume_status = data.get('resume_status', consultant.resume_status); consultant.attendance = data.get('attendance', consultant.attendance); consultant.opportunities = data.get('opportunities', consultant.opportunities); consultant.training = data.get('training', consultant.training); db.session.commit(); return jsonify(consultant.to_dict())
    if request.method == 'DELETE': db.session.delete(consultant); db.session.commit(); return jsonify({"message": "Consultant deleted"})

@app.route("/consultants", methods=["GET", "POST"])
def handle_consultants():
    if request.method == 'GET': return jsonify([c.to_dict() for c in Consultant.query.all()])
    if request.method == 'POST': data = request.json; new_consultant = Consultant(name=data['name'], username=data['username'].lower(), password_hash=generate_password_hash(data.get('password', '1234')), resume_text=data.get('resume_text', '')); db.session.add(new_consultant); db.session.commit(); return jsonify(new_consultant.to_dict()), 201

@app.route("/consultants/<int:id>/assign_training", methods=["POST"])
def assign_training(id):
    consultant = Consultant.query.get_or_404(id); consultant.training = f"Assigned: {request.json.get('skill')}"; consultant.attendance = "Task Assigned - Pending"; db.session.commit(); return jsonify(consultant.to_dict())

@app.route("/consultants/<int:id>/mark_attendance", methods=["POST"])
def mark_attendance(id):
    consultant = Consultant.query.get_or_404(id)
    
    # Simplified logic to prevent errors.
    # This will now only touch the 'attendance' and 'attendance_hours' fields.
    consultant.attendance = "Attended"
    
    if consultant.attendance_hours is None:
        consultant.attendance_hours = 0
        
    consultant.attendance_hours += 1
    
    db.session.commit()
    return jsonify(consultant.to_dict())

@app.route("/upload_resume", methods=["POST"])
def upload_resume():
    if 'file' not in request.files: return jsonify({"error": "No file part"}), 400
    file = request.files['file']
    if file.filename == '': return jsonify({"error": "No selected file"}), 400
    keyword_string = request.form.get('keywords', ''); required_keywords = [k.strip() for k in keyword_string.split(',') if k.strip()]
    filename = secure_filename(file.filename); temp_path = os.path.join(app.config['UPLOAD_FOLDER'], filename); file.save(temp_path)
    result = local_resume_check(temp_path, required_keywords); os.remove(temp_path); return jsonify(result)

@app.route("/leave/requests", methods=["GET"])
def get_all_leave_requests(): return jsonify([r.to_dict() for r in LeaveRequest.query.all()])

@app.route("/leave/requests/consultant/<int:consultant_id>", methods=["GET"])
def get_consultant_leave_requests(consultant_id):
    requests = LeaveRequest.query.filter_by(consultant_id=consultant_id).all(); return jsonify([r.to_dict() for r in requests])

@app.route("/leave/request", methods=["POST"])
def request_leave():
    data = request.json; new_request = LeaveRequest(consultant_id=data.get('consultant_id'), start_date=datetime.strptime(data.get('start_date'), '%Y-%m-%d'), end_date=datetime.strptime(data.get('end_date'), '%Y-%m-%d'), reason=data.get('reason')); db.session.add(new_request); db.session.commit(); return jsonify(new_request.to_dict()), 201

@app.route("/admin/shortlist", methods=["POST"])
def admin_shortlist():
    query = request.json.get('query')
    if not query: return jsonify({"error": "Query is required"}), 400
    query_embedding = get_ollama_embedding(query)
    if query_embedding is None: return jsonify({"error": "Could not connect to Ollama. Ensure Ollama is running."}), 503
    consultants = Consultant.query.all(); results = []
    for c in consultants:
        doc_embedding = get_ollama_embedding(c.resume_text or "")
        if doc_embedding: results.append({'consultant': c.to_dict(), 'score': float(cosine_similarity(query_embedding, doc_embedding))})
    threshold = 0.6
    matching = sorted([r for r in results if r['score'] > threshold], key=lambda x: x['score'], reverse=True)
    not_matching = sorted([r for r in results if r['score'] <= threshold], key=lambda x: x['score'], reverse=True)
    return jsonify({"matching": matching, "not_matching": not_matching})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)

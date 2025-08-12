import os
import requests
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from models import db, Consultant, LeaveRequest
from ResumeAgent import local_resume_check, generate_local_feedback
from datetime import datetime

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
        print("Populating database with 10 sample consultants and dummy resumes...")
        hashed_password = generate_password_hash('1234', method='pbkdf2:sha256')
        consultants_data = [
            {"name": "Arjun Kumar", "resume": "Experienced Python developer with skills in Flask, Django, and SQL databases. Worked on backend services and API development."},
            {"name": "Sneha Sharma", "resume": "Frontend specialist with expertise in React, Redux, and modern CSS. Passionate about user interface design and performance optimization."},
            {"name": "Ravi Singh", "resume": "Full-stack engineer proficient in JavaScript, Node.js, and Express. Also has experience with cloud deployment on AWS EC2 and S3."},
            {"name": "Meena Patel", "resume": "Data Scientist skilled in Python, Pandas, and Scikit-learn. Experience in machine learning models and data visualization with Matplotlib."},
            {"name": "Vikram Rathod", "resume": "DevOps engineer with a background in CI/CD pipelines using Jenkins and Docker. Manages cloud infrastructure on Microsoft Azure."},
            {"name": "Priya Desai", "resume": "Quality Assurance tester with a focus on automated testing using Selenium and Cypress. Strong understanding of Agile methodologies."},
            {"name": "Amit Verma", "resume": "Java developer with experience in Spring Boot and microservices architecture. Proficient with both SQL and NoSQL databases like MongoDB."},
            {"name": "Anjali Mehta", "resume": "Project Manager with PMP certification. Expert in stakeholder communication, risk management, and leading Agile teams."},
            {"name": "Rajesh Gupta", "resume": "Cybersecurity analyst focused on network security and vulnerability assessment. Familiar with tools like Wireshark and Metasploit."},
            {"name": "Sunita Reddy", "resume": "Cloud architect specializing in AWS solutions, including Lambda, RDS, and ECS. Designs scalable and resilient cloud systems."}
        ]
        for data in consultants_data:
            username = data["name"].split(" ")[0].lower()
            consultant = Consultant(name=data["name"], username=username, password_hash=hashed_password, resume_text=data["resume"])
            db.session.add(consultant)
        db.session.commit()
        print("Database populated.")

# --- HELPER FUNCTIONS FOR OLLAMA ---
def get_ollama_embedding(text):
    try:
        payload = {"model": OLLAMA_MODEL, "prompt": text}
        response = requests.post(OLLAMA_API_URL, json=payload)
        response.raise_for_status()
        return response.json()["embedding"]
    except requests.exceptions.RequestException as e:
        print(f"Error calling Ollama API: {e}")
        return None

def cosine_similarity(v1, v2):
    return np.dot(v1, v2) / (np.linalg.norm(v1) * np.linalg.norm(v2))

# --- API ENDPOINTS ---

# --- LOGIN ENDPOINTS ---
@app.route("/admin/login", methods=["POST"])
def admin_login():
    password = request.json.get('password')
    if password == "admin": return jsonify({"message": "Admin login successful"}), 200
    return jsonify({"error": "Invalid admin password"}), 401

@app.route("/login", methods=["POST"])
def consultant_login():
    data = request.json
    username, password = data.get('username'), data.get('password')
    consultant = Consultant.query.filter_by(username=username.lower()).first()
    if consultant and check_password_hash(consultant.password_hash, password):
        return jsonify(consultant.to_dict())
    return jsonify({"error": "Invalid credentials"}), 401

# --- CONSULTANT CRUD ENDPOINTS ---
@app.route("/consultants", methods=["GET"])
def get_consultants():
    return jsonify([c.to_dict() for c in Consultant.query.all()])

@app.route("/consultants/<int:id>", methods=["DELETE"])
def delete_consultant(id):
    consultant = Consultant.query.get_or_404(id)
    db.session.delete(consultant)
    db.session.commit()
    return jsonify({"message": "Consultant deleted"})

@app.route("/consultants", methods=["POST"])
def add_consultant():
    data = request.json
    new_consultant = Consultant(name=data['name'], username=data['username'].lower(), password_hash=generate_password_hash(data.get('password', '1234')), resume_text=data.get('resume_text', ''))
    db.session.add(new_consultant)
    db.session.commit()
    return jsonify(new_consultant.to_dict()), 201

@app.route("/consultants/<int:id>", methods=["PUT"])
def update_consultant_details(id):
    consultant = Consultant.query.get_or_404(id)
    data = request.json
    consultant.name = data.get('name', consultant.name)
    consultant.username = data.get('username', consultant.username).lower()
    consultant.resume_text = data.get('resume_text', consultant.resume_text)
    consultant.resume_status = data.get('resume_status', consultant.resume_status)
    consultant.attendance = data.get('attendance', consultant.attendance)
    consultant.opportunities = data.get('opportunities', consultant.opportunities)
    consultant.training = data.get('training', consultant.training)
    db.session.commit()
    return jsonify(consultant.to_dict())

# --- TRAINING ENDPOINTS ---
@app.route("/consultants/<int:id>/assign_training", methods=["POST"])
def assign_training(id):
    consultant = Consultant.query.get_or_404(id)
    consultant.training = f"Assigned: {request.json.get('skill')}"
    db.session.commit()
    return jsonify(consultant.to_dict())

@app.route("/consultants/<int:id>/unassign_training", methods=["POST"])
def unassign_training(id):
    consultant = Consultant.query.get_or_404(id)
    consultant.training = "Not Started"
    db.session.commit()
    return jsonify(consultant.to_dict())

# --- AI & RESUME ENDPOINTS ---
@app.route("/admin/shortlist", methods=["POST"])
def admin_shortlist():
    query = request.json.get('query')
    if not query: return jsonify({"error": "Query is required"}), 400
    query_embedding = get_ollama_embedding(query)
    if query_embedding is None:
        return jsonify({"error": "Could not connect to Ollama. Ensure Ollama is running."}), 503
    consultants = Consultant.query.all()
    results = []
    for c in consultants:
        doc_embedding = get_ollama_embedding(c.resume_text or "")
        if doc_embedding:
            score = cosine_similarity(query_embedding, doc_embedding)
            results.append({'consultant': c.to_dict(), 'score': float(score)})
    threshold = 0.6
    matching = sorted([r for r in results if r['score'] > threshold], key=lambda x: x['score'], reverse=True)
    not_matching = sorted([r for r in results if r['score'] <= threshold], key=lambda x: x['score'], reverse=True)
    return jsonify({"matching": matching, "not_matching": not_matching})

@app.route("/upload_resume", methods=["POST"])
def upload_resume():
    if 'file' not in request.files: return jsonify({"error": "No file part"}), 400
    file = request.files['file']
    keyword_string = request.form.get('keywords', '')
    required_keywords = {k.strip().lower() for k in keyword_string.split(',') if k.strip()}
    filename = secure_filename(file.filename)
    temp_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    file.save(temp_path)
    result = local_resume_check(temp_path, list(required_keywords))
    found_keywords_set = {k.lower() for k in result.get('found_keywords', [])}
    result['missing_keywords'] = list(required_keywords - found_keywords_set)
    os.remove(temp_path)
    return jsonify(result)

# --- LEAVE MANAGEMENT ENDPOINTS ---
@app.route("/leave/request", methods=["POST"])
def request_leave():
    data = request.json
    new_request = LeaveRequest(consultant_id=data.get('consultant_id'), start_date=datetime.strptime(data.get('start_date'), '%Y-%m-%d'), end_date=datetime.strptime(data.get('end_date'), '%Y-%m-%d'), reason=data.get('reason'))
    db.session.add(new_request)
    db.session.commit()
    return jsonify(new_request.to_dict()), 201

@app.route("/leave/requests/<int:request_id>", methods=["PUT"])
def update_leave_request(request_id):
    leave_request = LeaveRequest.query.get_or_404(request_id)
    leave_request.status = request.json.get('status')
    db.session.commit()
    return jsonify(leave_request.to_dict())

@app.route("/leave/requests/consultant/<int:consultant_id>", methods=["GET"])
def get_consultant_leave_requests(consultant_id):
    requests = LeaveRequest.query.filter_by(consultant_id=consultant_id).all()
    return jsonify([r.to_dict() for r in requests])

# --- FINAL APP RUN COMMAND ---
if __name__ == '__main__':
    # This host='0.0.0.0' is the final fix for the "Failed to fetch" error
    app.run(host='0.0.0.0', port=5000, debug=True)

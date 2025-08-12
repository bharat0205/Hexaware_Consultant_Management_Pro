import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename
from werkzeug.security import generate_password_hash, check_password_hash
from models import db, Consultant, LeaveRequest
from ResumeAgent import local_resume_check, generate_local_feedback
from datetime import datetime

# --- AI IMPORTS ---
from sentence_transformers import SentenceTransformer, util
# Load a pre-trained sentence-transformer model (will download on first run)
try:
    ai_model = SentenceTransformer('all-MiniLM-L6-v2')
except Exception as e:
    print(f"Error loading SentenceTransformer model: {e}")
    ai_model = None

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "http://localhost:3000"}})

# --- APP CONFIG AND DB SETUP ---
UPLOAD_FOLDER = 'temp_uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///database.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)

# --- ROBUST DATABASE INITIALIZATION WITH 10 CONSULTANTS ---
with app.app_context():
    db.create_all()
    # This block now runs robustly to populate the DB if it's empty.
    if Consultant.query.count() == 0:
        print("Database is empty. Populating with 10 sample consultants...")
        
        # The password for everyone is '1234'
        hashed_password = generate_password_hash('1234', method='pbkdf2:sha256')
        
        consultant_names = [
            "Arjun Kumar", "Sneha Sharma", "Ravi Singh", "Meena Patel", "Vikram Rathod",
            "Priya Desai", "Amit Verma", "Anjali Mehta", "Rajesh Gupta", "Sunita Reddy"
        ]
        
        for name in consultant_names:
            username = name.split(" ")[0].lower() # e.g., "Arjun Kumar" -> "arjun"
            consultant = Consultant(
                name=name,
                username=username,
                password_hash=hashed_password
            )
            db.session.add(consultant)
        
        db.session.commit()
        print("Database populated successfully.")

# --- API ENDPOINTS ---

# --- THIS IS THE CRITICAL LOGIN ROUTE ---
@app.route("/login", methods=["POST"])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({"error": "Username and password are required"}), 400

    consultant = Consultant.query.filter_by(username=username.lower()).first()

    if consultant and check_password_hash(consultant.password_hash, password):
        return jsonify(consultant.to_dict())
    else:
        return jsonify({"error": "Invalid credentials"}), 401

# --- ALL OTHER ENDPOINTS ---

@app.route("/consultants", methods=["GET"])
def get_consultants():
    consultants = Consultant.query.all()
    return jsonify([c.to_dict() for c in consultants])

@app.route("/consultants/<int:id>", methods=["PUT"])
def update_consultant(id):
    data = request.json
    consultant = Consultant.query.get(id)
    if consultant:
        consultant.resume_status = data.get("resume_status", consultant.resume_status)
        consultant.attendance = data.get("attendance", consultant.attendance)
        consultant.opportunities = data.get("opportunities", consultant.opportunities)
        consultant.training = data.get("training", consultant.training)
        db.session.commit()
        return jsonify(consultant.to_dict())
    return jsonify({"error": "Consultant not found"}), 404

@app.route("/upload_resume", methods=["POST"])
def upload_resume():
    try:
        if 'file' not in request.files: return jsonify({"error": "No file part"}), 400
        file = request.files['file']
        if file.filename == '': return jsonify({"error": "No selected file"}), 400
        keyword_string = request.form.get('keywords', '')
        if not keyword_string: return jsonify({"error": "No keywords provided"}), 400
        required_keywords = {k.strip().lower() for k in keyword_string.split(',') if k.strip()}
        filename = secure_filename(file.filename)
        temp_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(temp_path)
        result = local_resume_check(temp_path, list(required_keywords))
        found_keywords_set = {k.lower() for k in result.get('found_keywords', [])}
        missing_keywords = list(required_keywords - found_keywords_set)
        result['missing_keywords'] = missing_keywords
        os.remove(temp_path)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/generate_feedback", methods=["POST"])
def generate_feedback():
    try:
        data = request.json
        found_keywords = data.get('found_keywords', [])
        feedback = generate_local_feedback(found_keywords)
        return jsonify({"feedback": feedback})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/leave/request", methods=["POST"])
def request_leave():
    data = request.json
    consultant_id = data.get('consultant_id')
    start_date = datetime.strptime(data.get('start_date'), '%Y-%m-%d')
    end_date = datetime.strptime(data.get('end_date'), '%Y-%m-%d')
    reason = data.get('reason')
    if not all([consultant_id, start_date, end_date, reason]):
        return jsonify({"error": "Missing required fields"}), 400
    new_request = LeaveRequest(consultant_id=consultant_id, start_date=start_date, end_date=end_date, reason=reason)
    db.session.add(new_request)
    db.session.commit()
    return jsonify(new_request.to_dict()), 201

@app.route("/leave/requests", methods=["GET"])
def get_all_leave_requests():
    requests = LeaveRequest.query.all()
    return jsonify([r.to_dict() for r in requests])
    
@app.route("/leave/requests/consultant/<int:consultant_id>", methods=["GET"])
def get_consultant_leave_requests(consultant_id):
    requests = LeaveRequest.query.filter_by(consultant_id=consultant_id).all()
    return jsonify([r.to_dict() for r in requests])

@app.route("/leave/requests/<int:request_id>", methods=["PUT"])
def update_leave_request(request_id):
    data = request.json
    status = data.get('status')
    leave_request = LeaveRequest.query.get(request_id)
    if not leave_request:
        return jsonify({"error": "Request not found"}), 404
    leave_request.status = status
    db.session.commit()
    return jsonify(leave_request.to_dict())

@app.route("/admin/shortlist", methods=["POST"])
def admin_shortlist():
    if ai_model is None:
        return jsonify({"error": "AI model not loaded. Check backend console."}), 500
    data = request.json
    query = data.get('query')
    if not query:
        return jsonify({"error": "Query is required"}), 400
    consultants = Consultant.query.all()
    consultant_skill_summaries = [f"{c.name}: Skilled in {c.training} with a focus on {c.resume_status} tasks." for c in consultants]
    query_embedding = ai_model.encode(query, convert_to_tensor=True)
    consultant_embeddings = ai_model.encode(consultant_skill_summaries, convert_to_tensor=True)
    cosine_scores = util.pytorch_cos_sim(query_embedding, consultant_embeddings)
    matching_consultants = []
    not_matching_consultants = []
    threshold = 0.25
    for i in range(len(consultants)):
        consultant_data = consultants[i].to_dict()
        consultant_data['match_score'] = round(cosine_scores[0][i].item(), 4)
        if cosine_scores[0][i] > threshold:
            matching_consultants.append(consultant_data)
        else:
            not_matching_consultants.append(consultant_data)
    matching_consultants.sort(key=lambda x: x['match_score'], reverse=True)
    not_matching_consultants.sort(key=lambda x: x['match_score'], reverse=True)
    return jsonify({"matching": matching_consultants, "not_matching": not_matching_consultants})

@app.route("/consultants/<int:id>/assign_training", methods=["POST"])
def assign_training(id):
    data = request.json
    skill = data.get('skill')
    consultant = Consultant.query.get(id)
    if not consultant:
        return jsonify({"error": "Consultant not found"}), 404
    consultant.training = f"Assigned: {skill}"
    db.session.commit()
    return jsonify(consultant.to_dict())

if __name__ == '__main__':
    app.run(debug=True)

import os
import pdfplumber
import google.generativeai as genai
from datetime import datetime
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from models import db, Consultant

# ✅ Gemini API Key
os.environ["GEMINI_API_KEY"] = "AIzaSyA7lctcuV6WsvUflnFqClJeHhuzfWZ9-DM"
genai.configure(api_key=os.environ["GEMINI_API_KEY"])

# ✅ Ensure resume folder
if not os.path.exists("resumes"):
    os.makedirs("resumes")

# ✅ Flask app setup
app = Flask(__name__)
CORS(app)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///database.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)

# ✅ Create DB and seed if empty
with app.app_context():
    db.create_all()
    if Consultant.query.count() == 0:
        db.session.add_all([
            Consultant(name="Arjun", email="arjun@example.com", password="1234"),
            Consultant(name="Sneha", email="sneha@example.com", password="1234", resume_status="Updated", attendance="Completed", opportunities=2, training="In Progress"),
            Consultant(name="Ravi", email="ravi@example.com", password="1234"),
            Consultant(name="Meena", email="meena@example.com", password="1234", resume_status="Updated", attendance="Completed", opportunities=3, training="In Progress")
        ])
        db.session.commit()

@app.route("/")
def index():
    return "Hexaware Backend Running"

# ✅ Consultant Login
@app.route("/login", methods=["POST"])
def login():
    data = request.json
    email = data.get("email")
    password = data.get("password")
    consultant = Consultant.query.filter_by(email=email, password=password).first()
    if consultant:
        return jsonify({"success": True, "consultant_id": consultant.id, "name": consultant.name})
    return jsonify({"success": False, "error": "Invalid email or password"}), 401

# ✅ Get Consultants (with filters)
@app.route("/consultants", methods=["GET"])
def get_consultants():
    name_filter = request.args.get('name', '').lower()
    resume_status_filter = request.args.get('resume_status', '').lower()
    training_filter = request.args.get('training', '').lower()
    attendance_filter = request.args.get('attendance', '').lower()

    consultants = Consultant.query.all()
    filtered = []
    for c in consultants:
        if (name_filter in c.name.lower()) and \
           (resume_status_filter in c.resume_status.lower()) and \
           (training_filter in c.training.lower()) and \
           (attendance_filter in c.attendance.lower()):
            filtered.append(c.to_dict())
    return jsonify(filtered)

# ✅ Update Consultant Fields
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

# ✅ Upload Resume and Analyze
@app.route("/upload_resume", methods=["POST"])
def upload_resume():
    try:
        email = request.form.get('email')
        if not email:
            return jsonify({"error": "Consultant email is required."}), 400

        consultant = Consultant.query.filter_by(email=email).first()
        if not consultant:
            return jsonify({"error": "Consultant not found."}), 404

        if 'file' not in request.files:
            return jsonify({"error": "No file part"}), 400

        file = request.files['file']
        if file.filename == '':
            return jsonify({"error": "No selected file"}), 400

        filepath = os.path.join("resumes", file.filename)
        file.save(filepath)

        with pdfplumber.open(filepath) as pdf:
            text = ''
            for page in pdf.pages:
                extracted = page.extract_text()
                if extracted:
                    text += extracted + '\n'

        if not text.strip():
            return jsonify({"error": "No text extracted from PDF."}), 400

        prompt = f"""
From the following resume, extract two clean, comma-separated lists:
1) technical_skills: only skill names relevant to technical work (no ratings).
2) soft_skills: only skill names relevant to soft skills (no ratings).
Return strictly in this format:
technical_skills: skill1, skill2, ...
soft_skills: skill1, skill2, ...
Resume:
{text[:3000]}
        """

        try:
            print("🔍 Using Gemini 1.5")
            model = genai.GenerativeModel('gemini-1.5-pro-latest')
            response = model.generate_content(prompt)
            skill_text = response.text
        except Exception as e:
            print("⚠️ Gemini 1.5 failed:", e)
            print("🔄 Trying Gemini 2.5")
            model = genai.GenerativeModel('gemini-2.5-pro')
            response = model.generate_content(prompt)
            skill_text = response.text

        # ✅ Save upload date
        consultant.resume_upload_date = datetime.utcnow()
        db.session.commit()

        return jsonify({"skill_vector": skill_text})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ✅ Get Resume File
@app.route("/get_resume/<filename>", methods=["GET"])
def get_resume(filename):
    try:
        filepath = os.path.join("resumes", filename)
        return send_file(filepath, as_attachment=True)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ✅ Generate AI Feedback
@app.route("/generate_feedback", methods=["POST"])
def generate_feedback():
    try:
        data = request.json
        skills = data.get('skills', '')
        prompt = f"""You are an AI career coach. Based on these skills:\n{skills}\nGive a short, personalized feedback."""
        model = genai.GenerativeModel('gemini-1.5-pro-latest')
        response = model.generate_content(prompt)
        return jsonify({"feedback": response.text})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ✅ Consultant Stats
@app.route("/consultant_stats", methods=["GET"])
def consultant_stats():
    consultants = Consultant.query.all()
    stats = {
        "total": len(consultants),
        "resumes_updated": sum(1 for c in consultants if c.resume_status == "Updated"),
        "attendance_completed": sum(1 for c in consultants if c.attendance == "Completed"),
        "training_completed": sum(1 for c in consultants if c.training == "Completed"),
        "has_opportunities": sum(1 for c in consultants if c.opportunities > 0)
    }
    return jsonify(stats)

if __name__ == '__main__':
    app.run(debug=True)
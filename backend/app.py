import google.generativeai as genai
import os
import pdfplumber
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from models import db, Consultant

# ✅ Gemini API key setup
os.environ["GEMINI_API_KEY"] = "AIzaSyA7lctcuV6WsvUflnFqClJeHhuzfWZ9-DM"
genai.configure(api_key="AIzaSyA7lctcuV6WsvUflnFqClJeHhuzfWZ9-DM")

app = Flask(__name__)
CORS(app)

# ✅ Database setup
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///database.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)

# ✅ Initialize database with default consultants
with app.app_context():
    db.create_all()
    if Consultant.query.count() == 0:
        c1 = Consultant(name="Arjun")
        c2 = Consultant(name="Sneha", resume_status="Updated", attendance="Completed", opportunities=2, training="In Progress")
        c3 = Consultant(name="Ravi")
        c4 = Consultant(name="Meena", resume_status="Updated", attendance="Completed", opportunities=3, training="In Progress")
        db.session.add_all([c1, c2, c3, c4])
        db.session.commit()

# ✅ Get all consultants
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
# ✅ Update consultant fields
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

# ✅ Upload resume, extract text, and get skills using Gemini with fallback
@app.route("/upload_resume", methods=["POST"])
def upload_resume():
    try:
        if 'file' not in request.files:
            print("❌ No file part in request")
            return jsonify({"error": "No file part"}), 400

        file = request.files['file']

        if file.filename == '':
            print("❌ No selected file")
            return jsonify({"error": "No selected file"}), 400

        print("✅ File received:", file.filename)

        with pdfplumber.open(file) as pdf:
            text = ''
            for page in pdf.pages:
                extracted = page.extract_text()
                if extracted:
                    text += extracted + '\n'

        print("✅ Extracted text length:", len(text))

        if not text.strip():
            print("❌ No text extracted from PDF.")
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

        # ✅ Try Gemini-1.5-Pro-Latest first
        try:
            print("✅ Trying Gemini model: gemini-1.5-pro-latest")
            model = genai.GenerativeModel('gemini-1.5-pro-latest')
            response = model.generate_content(prompt)
            skill_text = response.text
            print("✅ Gemini 1.5 returned successfully.")

        except Exception as e:
            print("❌ Gemini 1.5 failed:", str(e))
            print("✅ Trying Gemini model: gemini-2.5-pro")
            try:
                model = genai.GenerativeModel('gemini-2.5-pro')
                response = model.generate_content(prompt)
                skill_text = response.text
                print("✅ Gemini 2.5 returned successfully.")
            except Exception as e2:
                print("❌ Gemini 2.5 also failed:", str(e2))
                return jsonify({"error": f"Both Gemini models failed: {str(e2)}"}), 500

        return jsonify({"skill_vector": skill_text})

    except Exception as e:
        print("❌ Exception occurred:", str(e))
        return jsonify({"error": str(e)}), 500
@app.route("/generate_feedback", methods=["POST"])
def generate_feedback():
    try:
        data = request.json
        skills = data.get('skills', '')

        prompt = f"""
You are an AI career advisor. Based on these consultant skills:
{skills}

Provide a 3-4 line personalized, encouraging feedback on what the consultant is good at and what they could focus on to improve.
"""

        try:
            print("✅ Generating feedback using gemini-1.5-pro-latest")
            model = genai.GenerativeModel('gemini-1.5-pro-latest')
            response = model.generate_content(prompt)
            feedback = response.text

        except Exception as e:
            print("❌ Gemini 1.5 failed, using gemini-2.5-pro:", str(e))
            model = genai.GenerativeModel('gemini-2.5-pro')
            response = model.generate_content(prompt)
            feedback = response.text

        return jsonify({"feedback": feedback})

    except Exception as e:
        print("❌ Exception occurred in feedback:", str(e))
        return jsonify({"error": str(e)}), 500
if __name__ == '__main__':
    app.run(debug=True)

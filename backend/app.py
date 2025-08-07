import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename
from models import db, Consultant
# This line correctly imports the functions from the other file
from ResumeAgent import local_resume_check, generate_local_feedback

app = Flask(__name__)

# This line correctly handles CORS to allow your frontend to connect
CORS(app, resources={r"/*": {"origins": "http://localhost:3000"}})

# Define a folder for temporary file uploads
UPLOAD_FOLDER = 'temp_uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Database setup
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///database.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)

# Initialize database
with app.app_context():
    db.create_all()
    if Consultant.query.count() == 0:
        c1 = Consultant(name="Arjun")
        c2 = Consultant(name="Sneha", resume_status="Updated", attendance="Completed", opportunities=2, training="In Progress")
        c3 = Consultant(name="Ravi")
        c4 = Consultant(name="Meena", resume_status="Updated", attendance="Completed", opportunities=3, training="In Progress")
        db.session.add_all([c1, c2, c3, c4])
        db.session.commit()

# --- API ROUTES ---

@app.route("/consultants", methods=["GET"])
def get_consultants():
    # Your filter logic from the original file was not in the version you sent.
    # This simplified version will work. If you need the filters, you can add them back.
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
        
        keywords = [k.strip() for k in keyword_string.split(',') if k.strip()]
        filename = secure_filename(file.filename)
        temp_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(temp_path)
        
        result = local_resume_check(temp_path, keywords) # Call the helper function
        
        os.remove(temp_path)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/generate_feedback", methods=["POST"])
def generate_feedback():
    try:
        data = request.json
        found_keywords = data.get('found_keywords', [])
        feedback = generate_local_feedback(found_keywords) # Call the helper function
        return jsonify({"feedback": feedback})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)


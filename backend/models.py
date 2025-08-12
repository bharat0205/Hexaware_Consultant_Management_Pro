from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class Consultant(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), nullable=False)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    resume_status = db.Column(db.String(50), default='Not Started')
    attendance = db.Column(db.String(50), default='Not Started')
    opportunities = db.Column(db.Integer, default=0)
    training = db.Column(db.String(50), default='Not Started')
    # This relationship links a Consultant to their LeaveRequests
    leave_requests = db.relationship('LeaveRequest', backref='consultant', lazy=True)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "username": self.username,
            "resume_status": self.resume_status,
            "attendance": self.attendance,
            "opportunities": self.opportunities,
            "training": self.training,
        }

# --- THIS IS THE MISSING CLASS THAT CAUSED THE ERROR ---
class LeaveRequest(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    reason = db.Column(db.String(200), nullable=False)
    start_date = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    end_date = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    status = db.Column(db.String(50), default='Pending') # Can be 'Pending', 'Approved', 'Rejected'
    consultant_id = db.Column(db.Integer, db.ForeignKey('consultant.id'), nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "consultant_name": self.consultant.name,
            "reason": self.reason,
            "start_date": self.start_date.strftime('%Y-%m-%d'),
            "end_date": self.end_date.strftime('%Y-%m-%d'),
            "status": self.status,
            "consultant_id": self.consultant_id
        }

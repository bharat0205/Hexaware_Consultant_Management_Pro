from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class Consultant(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(80), nullable=False)
    resume_status = db.Column(db.String(50), default="Not Updated")
    attendance = db.Column(db.String(50), default="Not Completed")
    opportunities = db.Column(db.Integer, default=0)
    training = db.Column(db.String(50), default="Not Started")
    resume_upload_date = db.Column(db.DateTime, nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "resume_status": self.resume_status,
            "attendance": self.attendance,
            "opportunities": self.opportunities,
            "training": self.training,  # ✅ Comma added here
            "resume_upload_date": self.resume_upload_date.strftime('%Y-%m-%d %H:%M:%S') if self.resume_upload_date else None
        }
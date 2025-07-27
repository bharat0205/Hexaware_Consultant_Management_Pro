from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class Consultant(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    resume_status = db.Column(db.String(50), default="Pending")
    attendance = db.Column(db.String(50), default="Missed")
    opportunities = db.Column(db.Integer, default=0)
    training = db.Column(db.String(50), default="Not Started")

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "resume_status": self.resume_status,
            "attendance": self.attendance,
            "opportunities": self.opportunities,
            "training": self.training
        }

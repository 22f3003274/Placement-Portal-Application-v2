from flask import Blueprint, request, jsonify
from flask_jwt_extended import get_jwt_identity
from app.extensions import db
from app.models import User, StudentProfile, PlacementDrive, Application, DriveStatus, ApplicationStatus
from app.utils.decorators import student_required
from werkzeug.utils import secure_filename
from datetime import date
import os

student_bp = Blueprint("student", __name__)

UPLOAD_FOLDER = os.path.join("static", "resumes")
ALLOWED_EXTENSIONS = {"pdf", "doc", "docx"}

@student_bp.route("/dashboard", methods=["GET"])
@student_required
def student_dashboard():
    # get student profile, drives, and application history
    student = StudentProfile.query.filter_by(user_id=int(get_jwt_identity())).first()
    drives = PlacementDrive.query.filter_by(status=DriveStatus.APPROVED).all()
    applications = Application.query.filter_by(student_id=student.id).all()

    return jsonify({
        "student": {
            "id": student.id,
            "roll_number": student.roll_number,
            "branch": student.branch,
            "year": student.year,
            "cgpa": student.cgpa,
            "skills": student.skills,
            "resume": student.resume
        },
        "drives": [{
            "id": d.id,
            "company_name": d.company.company_name if d.company else "Unknown",
            "job_title": d.job_title,
            "job_description": d.job_description,
            "salary_lpa": d.salary_lpa,
            "application_deadline": str(d.application_deadline)
        } for d in drives],
        "applications": [{
            "id": a.id,
            "drive_id": a.drive_id,
            "job_title": a.drive.job_title if a.drive else "Unknown",
            "company_name": a.drive.company.company_name if a.drive and a.drive.company else "Unknown",
            "status": a.status.value,
            "applied_at": str(a.applied_at)
        } for a in applications],
        "notifications": [
            {"message": f"Your application for {a.drive.job_title} is: {a.status.value.upper()}"}
            for a in applications if a.status != ApplicationStatus.APPLIED
        ]
    }), 200

@student_bp.route("/apply/<int:drive_id>", methods=["POST"])
@student_required
def apply_drive(drive_id):
    # Apply to a drive
    student = StudentProfile.query.filter_by(user_id=int(get_jwt_identity())).first()
    drive = PlacementDrive.query.get_or_404(drive_id)

    if drive.status != DriveStatus.APPROVED or drive.application_deadline < date.today():
        return jsonify({"error": "Drive unavailable/closed"}), 400

    if Application.query.filter_by(student_id=student.id, drive_id=drive_id).first():
        return jsonify({"error": "Already applied"}), 409

    db.session.add(Application(student_id=student.id, drive_id=drive_id))
    db.session.commit()
    return jsonify({"message": "Applied successfully"}), 201

@student_bp.route("/profile/update", methods=["POST"])
@student_required
def update_profile():
    # Update profile info and resume
    uid = int(get_jwt_identity())
    user = User.query.get(uid)
    student = StudentProfile.query.filter_by(user_id=uid).first()

    if "name" in request.form:
        user.name = request.form["name"].strip()
    if "phone" in request.form:
        user.phone = request.form["phone"].strip()

    student.roll_number = request.form.get("roll_number", student.roll_number)
    student.branch = request.form.get("branch", student.branch)
    student.skills = request.form.get("skills", student.skills)
    student.year = int(request.form["year"]) if "year" in request.form else student.year
    student.cgpa = float(request.form["cgpa"]) if "cgpa" in request.form else student.cgpa

    file = request.files.get("resume")
    if file:
        filename = secure_filename(file.filename)
        if filename:
            extension = filename.split(".")[-1].lower()
            if extension in ALLOWED_EXTENSIONS:
                os.makedirs(UPLOAD_FOLDER, exist_ok=True)
                file_path = os.path.join(UPLOAD_FOLDER, filename)
                file.save(file_path)
                student.resume = file_path

    db.session.commit()
    return jsonify({"message": "Profile updated"}), 200

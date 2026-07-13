from flask import Blueprint, request, jsonify
from flask_jwt_extended import get_jwt_identity
from werkzeug.utils import secure_filename
from datetime import date, datetime, timezone
import os
from apps.extensions import db, cache
from apps.models import (User, StudentProfile, PlacementDrive, Application, DriveStatus, ApplicationStatus)
from apps.routes.auth_routes import student_required


student_bp = Blueprint("student", __name__)

UPLOAD_FOLDER = "static/resumes"
ALLOWED_EXTENSIONS = {"pdf", "doc", "docx"}


@student_bp.route("/dashboard")
@student_required
@cache.cached(timeout=60, query_string=True)
def dashboard():

    user_id = int(get_jwt_identity())
    student = StudentProfile.query.filter_by(user_id=user_id).first()
    drives = PlacementDrive.query.filter_by(status=DriveStatus.APPROVED).all()
    applications = Application.query.filter_by(student_id=student.id).all()

    drive_list = [{
    "id": drive.id,
    "company_name": drive.company.company_name,
    "job_title": drive.job_title,
    "job_description": drive.job_description,
    "salary_lpa": drive.salary_lpa,
    "application_deadline": str(drive.application_deadline)
    } for drive in drives]

    application_list = [{
    "id": app.id,
    "drive_id": app.drive_id,
    "job_title": app.drive.job_title,
    "company_name": app.drive.company.company_name,
    "status": app.status.value,
    "interview_date": str(app.interview_date) if app.interview_date else None,
    "applied_at": str(app.applied_at),
    "logs": app.history or []
    } for app in applications]
        
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
        "drives": drive_list,
        "applications": application_list
    })


@student_bp.route("/apply/<int:drive_id>", methods=["POST"])
@student_required
def apply(drive_id):

    user_id = int(get_jwt_identity())
    student = StudentProfile.query.filter_by(user_id=user_id).first()
    drive = PlacementDrive.query.get_or_404(drive_id)

    if drive.status != DriveStatus.APPROVED:
        return jsonify({"error": "Drive not available"}), 400
    if drive.application_deadline < date.today():
        return jsonify({"error": "Application deadline passed"}), 400

    old_application = Application.query.filter_by(student_id=student.id,drive_id=drive_id).first()
    if old_application:
        return jsonify({"error": "Already applied"}), 409

    history = [{
        "status_from": None,
        "status_to": ApplicationStatus.APPLIED.value,
        "changed_at": str(datetime.now(timezone.utc))
    }]
    application = Application(student_id=student.id,drive_id=drive_id,history=history)
    db.session.add(application)
    db.session.commit()
    cache.clear()

    return jsonify({"message": "Applied successfully"}), 201


@student_bp.route("/profile/update", methods=["PATCH"])
@student_required
def update_profile():
    user_id = int(get_jwt_identity())
    student = StudentProfile.query.filter_by(user_id=user_id).first()
    
    roll_val = request.form.get("roll_number")
    if roll_val is not None:
        student.roll_number = roll_val.strip() if roll_val.strip() else None

    branch_val = request.form.get("branch")
    if branch_val is not None:
        student.branch = branch_val.strip() if branch_val.strip() else None

    skills_val = request.form.get("skills")
    if skills_val is not None:
        student.skills = skills_val.strip() if skills_val.strip() else None

    year_val = request.form.get("year")
    if year_val is not None:
        student.year = int(year_val) if year_val.strip() else None

    cgpa_val = request.form.get("cgpa")
    if cgpa_val is not None:
        student.cgpa = float(cgpa_val) if cgpa_val.strip() else None

    resume = request.files.get("resume")
    if resume and resume.filename:
        filename = secure_filename(resume.filename)
        os.makedirs(UPLOAD_FOLDER, exist_ok=True)
        filepath = os.path.join(UPLOAD_FOLDER, f"user_{user_id}_{filename}")
        resume.save(filepath)
        student.resume = filepath

    db.session.commit()
    cache.clear()   
    return jsonify({"message": "Profile updated!"})


@student_bp.route("/export-history", methods=["POST"])
@student_required
def export_history():
    from apps.tasks import export_csv_data
    user_id = int(get_jwt_identity())
    task = export_csv_data.delay(user_id,"student")
    return jsonify({"message": "CSV export started", "task_id": task.id}), 202

@student_bp.route("/task-status/<task_id>")
@student_required
def task_status(task_id):
    from apps.celery_workers import celery
    task = celery.AsyncResult(task_id)
    if task.state == "SUCCESS":
        return jsonify({"state": task.state, "file_url": "/" + task.result})
    return jsonify({"state": task.state})

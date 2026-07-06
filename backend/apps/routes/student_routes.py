from flask import Blueprint, request, jsonify
from flask_jwt_extended import get_jwt_identity
from werkzeug.utils import secure_filename
from datetime import date, datetime, timezone
import os
from apps.extensions import db
from apps.models import (User, StudentProfile, PlacementDrive, Application, DriveStatus, ApplicationStatus)
from apps.routes.auth_routes import student_required


student_bp = Blueprint("student", __name__)

UPLOAD_FOLDER = "static/resumes"
ALLOWED_EXTENSIONS = {"pdf", "doc", "docx"}


@student_bp.route("/dashboard")
@student_required
def dashboard():

    user_id = int(get_jwt_identity())
    student = StudentProfile.query.filter_by(user_id=user_id).first()
    drives = PlacementDrive.query.filter_by(status=DriveStatus.APPROVED).all()
    applications = Application.query.filter_by(student_id=student.id).all()

    drive_list = []
    for drive in drives:
        drive_list.append({
            "id": drive.id,
            "company_name": drive.company.company_name,
            "job_title": drive.job_title,
            "job_description": drive.job_description,
            "salary_lpa": drive.salary_lpa,
            "application_deadline": str(drive.application_deadline)
        })

    application_list = []
    for application in applications:
        application_list.append({
            "id": application.id,
            "drive_id": application.drive_id,
            "job_title": application.drive.job_title,
            "company_name": application.drive.company.company_name,
            "status": application.status.value,
            "interview_date": str(application.interview_date) if application.interview_date else None,
            "applied_at": str(application.applied_at),
            "logs": application.history or []
        })
        
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

    return jsonify({"message": "Applied successfully"}), 201


@student_bp.route("/profile/update", methods=["POST"])
@student_required
def update_profile():

    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    student = StudentProfile.query.filter_by(user_id=user_id).first()
    student.roll_number = request.form.get("roll_number",student.roll_number)
    student.branch = request.form.get("branch",student.branch)
    student.skills = request.form.get("skills",student.skills)

    if request.form.get("year"):
        student.year = int(request.form["year"])
    if request.form.get("cgpa"):
        student.cgpa = float(request.form["cgpa"])

    resume = request.files.get("resume")
    if resume:
        filename = secure_filename(resume.filename)
        extension = filename.split(".")[-1].lower()
        if extension in ALLOWED_EXTENSIONS:
            os.makedirs(UPLOAD_FOLDER,exist_ok=True)
            file_path = os.path.join(UPLOAD_FOLDER,filename)
            resume.save(file_path)
            student.resume = file_path

    db.session.commit()
    return jsonify({"message": "Profile updated"})


@student_bp.route("/export-history", methods=["POST"])
@student_required
def export_history():

    from apps.tasks import export_csv_data
    user_id = int(get_jwt_identity())
    export_csv_data.delay(user_id,"student")

    return jsonify({"message": "CSV export started"}), 202

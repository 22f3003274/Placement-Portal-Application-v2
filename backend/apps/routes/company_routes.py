from flask import Blueprint, request, jsonify
from flask_jwt_extended import get_jwt_identity
from datetime import datetime, timezone
from sqlalchemy.orm.attributes import flag_modified
from apps.extensions import db, cache
from apps.models import (CompanyProfile, PlacementDrive, Application, ApprovalStatus, DriveStatus, ApplicationStatus)
from apps.routes.auth_routes import company_required


company_bp = Blueprint("company", __name__)


def get_company():
    user_id = int(get_jwt_identity())
    return CompanyProfile.query.filter_by(user_id=user_id).first()


@company_bp.route("/dashboard")
@company_required
@cache.cached(timeout=60, query_string=True)
def dashboard():
    company = get_company()
    drives = PlacementDrive.query.filter_by(company_id=company.id).all()
    total_applications = Application.query.join(PlacementDrive).filter(PlacementDrive.company_id == company.id).count()

    drive_list = [{
    "id": drive.id,
    "job_title": drive.job_title,
    "job_description": drive.job_description,
    "eligibility_criteria": drive.eligibility_criteria,
    "salary_lpa": drive.salary_lpa,
    "application_deadline": str(drive.application_deadline),
    "status": drive.status.value
    } for drive in drives]
    return jsonify({
        "company": {
            "id": company.id,
            "company_name": company.company_name,
            "location": company.location,
            "website": company.website,
            "approval_status": company.approval_status.value
        },
        "total_drives": len(drives),
        "total_applications": total_applications,
        "drives": drive_list
    })


@company_bp.route("/drive/create", methods=["POST"])
@company_required
def create_drive():
    company = get_company()
    if company.approval_status != ApprovalStatus.APPROVED:
        return jsonify({"error": "Company not approved"}), 403

    data = request.get_json()

    deadline = datetime.strptime(data["application_deadline"],"%Y-%m-%d").date()
    drive = PlacementDrive(
        company_id=company.id,
        job_title=data["job_title"],
        job_description=data["job_description"],
        eligibility_criteria=data.get("eligibility_criteria"),
        salary_lpa=data.get("salary_lpa"),
        application_deadline=deadline,
        status=DriveStatus.PENDING
    )
    db.session.add(drive)
    db.session.commit()
    cache.clear()
    return jsonify({"message": "Drive created"}), 201


@company_bp.route("/drive/close/<int:drive_id>", methods=["POST"])
@company_required
def close_drive(drive_id):
    company = get_company()
    drive = PlacementDrive.query.filter_by(id=drive_id, company_id=company.id).first_or_404()
    drive.status = DriveStatus.CLOSED
    db.session.commit()
    cache.clear()
    return jsonify({"message": "Drive closed"})


@company_bp.route("/drive/<int:drive_id>/applications")
@company_required
@cache.cached(timeout=60, query_string=True)
def applications(drive_id):
    company = get_company()
    drive = PlacementDrive.query.filter_by(id=drive_id, company_id=company.id).first_or_404()

    applications = [{
    "application_id": app.id,
    "status": app.status.value,
    "interview_date": str(app.interview_date) if app.interview_date else None,
    "student": {
        "name": app.student.user.name,
        "email": app.student.user.email,
        "roll_number": app.student.roll_number,
        "branch": app.student.branch,
        "cgpa": app.student.cgpa,
        "skills": app.student.skills,
        "resume": app.student.resume
    }} for app in drive.applications]
    return jsonify(applications)


@company_bp.route("/application/<int:app_id>/status", methods=["POST"])
@company_required
def update_status(app_id):
    company = get_company()

    application = Application.query.get_or_404(app_id)
    if application.drive.company_id != company.id:
        return jsonify({"error": "Access denied"}), 403

    data = request.get_json()
    old_status = application.status.value
    new_status = ApplicationStatus(data["status"])
    application.status = new_status

    if data.get("interview_date"):
        application.interview_date = datetime.fromisoformat(data["interview_date"])

    history = application.history or []
    history.append({
        "status_from": old_status,
        "status_to": new_status.value,
        "changed_at": str(datetime.now(timezone.utc))
    })

    application.history = history
    flag_modified(application, "history")
    

    if new_status == ApplicationStatus.PLACED:
        from apps.models import Placement
        existing_placement = Placement.query.filter_by(application_id=application.id).first()
        if not existing_placement:
            placement = Placement(
                application_id=application.id,
                company_id=company.id,
                student_id=application.student_id,
                drive_id=application.drive_id,
                job_title=application.drive.job_title,
                salary_lpa=application.drive.salary_lpa,
                joining_date=None
            )
            db.session.add(placement)
            
    db.session.commit()
    cache.clear()
    return jsonify({"message": "Status updated"})


@company_bp.route("/export-history", methods=["POST"])
@company_required
def export_history():
    from apps.tasks import export_csv_data

    company = get_company()
    task = export_csv_data.delay(company.id, "company")
    return jsonify({"message": "CSV export started", "task_id": task.id}), 202


@company_bp.route("/task-status/<task_id>")
@company_required
def task_status(task_id):
    from apps.celery_workers import celery

    task = celery.AsyncResult(task_id)

    if task.state == "SUCCESS":
        return jsonify({
            "state": task.state,
            "file_url": "/" + task.result
        })

    return jsonify({"state": task.state})
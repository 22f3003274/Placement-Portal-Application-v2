from flask import Blueprint, request, jsonify
from flask_jwt_extended import get_jwt_identity
from app.extensions import db
from app.models import CompanyProfile, PlacementDrive, Application, ApprovalStatus, DriveStatus, ApplicationStatus
from app.utils.decorators import company_required
from datetime import datetime

company_bp = Blueprint("company", __name__)

@company_bp.route("/dashboard", methods=["GET"])
@company_required
def company_dashboard():
    # Retrieve company profile, stats, and drives list
    company = CompanyProfile.query.filter_by(user_id=int(get_jwt_identity())).first()
    drives = PlacementDrive.query.filter_by(company_id=company.id).all()
    total_apps = Application.query.join(PlacementDrive).filter(PlacementDrive.company_id == company.id).count()

    return jsonify({
        "company": {
            "id": company.id,
            "company_name": company.company_name,
            "location": company.location,
            "website": company.website,
            "approval_status": company.approval_status.value
        },
        "total_drives": len(drives),
        "total_applications": total_apps,
        "drives": [{
            "id": d.id,
            "job_title": d.job_title,
            "job_description": d.job_description,
            "eligibility_criteria": d.eligibility_criteria,
            "salary_lpa": d.salary_lpa,
            "application_deadline": str(d.application_deadline),
            "status": d.status.value
        } for d in drives]
    }), 200

@company_bp.route("/drive/create", methods=["POST"])
@company_required
def create_drive():
    # Create new job drive if company is approved
    company = CompanyProfile.query.filter_by(user_id=int(get_jwt_identity())).first()
    if company.approval_status != ApprovalStatus.APPROVED:
        return jsonify({"error": "Company not approved"}), 403

    data = request.get_json()
    drive = PlacementDrive(
        company_id=company.id,
        job_title=data["job_title"],
        job_description=data["job_description"],
        eligibility_criteria=data.get("eligibility_criteria"),
        salary_lpa=data.get("salary_lpa"),
        application_deadline=datetime.strptime(data["application_deadline"], "%Y-%m-%d").date(),
        status=DriveStatus.PENDING
    )
    db.session.add(drive)
    db.session.commit()
    return jsonify({"message": "Drive created"}), 201

@company_bp.route("/drive/close/<int:drive_id>", methods=["POST"])
@company_required
def close_drive(drive_id):
    # Close an active placement drive
    company = CompanyProfile.query.filter_by(user_id=int(get_jwt_identity())).first()
    drive = PlacementDrive.query.filter_by(id=drive_id, company_id=company.id).first_or_404()
    drive.status = DriveStatus.CLOSED
    db.session.commit()
    return jsonify({"message": "Drive closed"}), 200

@company_bp.route("/drive/<int:drive_id>/applications", methods=["GET"])
@company_required
def view_drive_applications(drive_id):
    # View all applicants for a drive
    company = CompanyProfile.query.filter_by(user_id=int(get_jwt_identity())).first()
    drive = PlacementDrive.query.filter_by(id=drive_id, company_id=company.id).first_or_404()
    apps = Application.query.filter_by(drive_id=drive.id).all()

    return jsonify([{
        "application_id": a.id,
        "status": a.status.value,
        "applied_at": str(a.applied_at),
        "student": {
            "name": a.student.user.name,
            "email": a.student.user.email,
            "roll_number": a.student.roll_number,
            "branch": a.student.branch,
            "cgpa": a.student.cgpa,
            "skills": a.student.skills,
            "resume": a.student.resume
        }
    } for a in apps]), 200

@company_bp.route("/application/<int:app_id>/status", methods=["POST"])
@company_required
def update_application_status(app_id):
    # Update application status (shortlist, accept, reject)
    company = CompanyProfile.query.filter_by(user_id=int(get_jwt_identity())).first()
    app = Application.query.get_or_404(app_id)
    
    if app.drive.company_id != company.id:
        return jsonify({"error": "Unauthorized"}), 403

    app.status = ApplicationStatus(request.get_json()["status"])
    db.session.commit()
    return jsonify({"message": "Status updated"}), 200

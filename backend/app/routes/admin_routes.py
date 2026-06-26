from flask import Blueprint, request, jsonify
from app.extensions import db
from app.models import User, Role, StudentProfile, CompanyProfile, PlacementDrive, Application, ApprovalStatus, DriveStatus
from app.utils.decorators import admin_required

admin_bp = Blueprint("admin", __name__)

@admin_bp.route("/stats", methods=["GET"])
@admin_required
def get_stats():
    # Return count statistics for admin dashboard
    return jsonify({
        "students": User.query.filter_by(role=Role.STUDENT).count(),
        "companies": CompanyProfile.query.count(),
        "drives": PlacementDrive.query.count(),
        "applications": Application.query.count()
    }), 200

@admin_bp.route("/students", methods=["GET"])
@admin_required
def get_students():
    # List all students, supporting simple search
    search = request.args.get("search", "").strip()
    query = User.query.filter_by(role=Role.STUDENT)
    if search:
        query = query.filter((User.name.like(f"%{search}%")) | (User.email.like(f"%{search}%")))
    
    return jsonify([{
        "id": u.id,
        "name": u.name,
        "email": u.email,
        "is_blacklisted": u.is_blacklisted,
        "roll_number": u.student_profile.roll_number if u.student_profile else None,
        "branch": u.student_profile.branch if u.student_profile else None
    } for u in query.all()]), 200

@admin_bp.route("/companies", methods=["GET"])
@admin_required
def get_companies():
    # List all company profiles, supporting search
    search = request.args.get("search", "").strip()
    query = CompanyProfile.query
    if search:
        query = query.filter(CompanyProfile.company_name.like(f"%{search}%"))
        
    return jsonify([{
        "id": c.id,
        "company_name": c.company_name,
        "approval_status": c.approval_status.value,
        "location": c.location,
        "website": c.website,
        "user_id": c.user.id if c.user else None,
        "is_blacklisted": c.user.is_blacklisted if c.user else False
    } for c in query.all()]), 200

@admin_bp.route("/drives", methods=["GET"])
@admin_required
def get_drives():
    # List all placement drives
    return jsonify([{
        "id": d.id,
        "company_name": d.company.company_name if d.company else "Unknown",
        "job_title": d.job_title,
        "salary_lpa": d.salary_lpa,
        "status": d.status.value,
        "application_deadline": str(d.application_deadline)
    } for d in PlacementDrive.query.all()]), 200

@admin_bp.route("/applications", methods=["GET"])
@admin_required
def get_applications():
    # List all student applications
    return jsonify([{
        "id": a.id,
        "student_name": a.student.user.name if a.student else "Unknown",
        "company_name": a.drive.company.company_name if a.drive and a.drive.company else "Unknown",
        "job_title": a.drive.job_title if a.drive else "Unknown",
        "status": a.status.value,
        "applied_at": str(a.applied_at)
    } for a in Application.query.all()]), 200

@admin_bp.route("/companies/<int:company_id>/status", methods=["POST"])
@admin_required
def update_company_status(company_id):
    # Approve or reject company registration
    company = CompanyProfile.query.get_or_404(company_id)
    company.approval_status = ApprovalStatus(request.get_json()["status"])
    db.session.commit()
    return jsonify({"message": "Company status updated"}), 200

@admin_bp.route("/drives/<int:drive_id>/status", methods=["POST"])
@admin_required
def update_drive_status(drive_id):
    # Approve, reject, or close a drive
    drive = PlacementDrive.query.get_or_404(drive_id)
    drive.status = DriveStatus(request.get_json()["status"])
    db.session.commit()
    return jsonify({"message": "Drive status updated"}), 200

@admin_bp.route("/users/<int:user_id>/toggle-blacklist", methods=["POST"])
@admin_required
def toggle_user_blacklist(user_id):
    # Blacklist or unblacklist user
    user = User.query.get_or_404(user_id)
    user.is_blacklisted = not user.is_blacklisted
    db.session.commit()
    return jsonify({"message": "Blacklist toggled"}), 200


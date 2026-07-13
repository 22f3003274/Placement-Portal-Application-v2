from flask import Blueprint, request, jsonify
from sqlalchemy import func
from apps.extensions import db, cache
from apps.models import User,Role,StudentProfile,CompanyProfile,PlacementDrive,Application,ApprovalStatus,DriveStatus,Placement
from apps.routes.auth_routes import admin_required


admin_bp = Blueprint("admin", __name__)

@admin_bp.route("/stats")
@admin_required
@cache.cached(timeout=60, query_string=True)
def stats():
    return jsonify({
        "students": User.query.filter_by(role=Role.STUDENT).count(),
        "companies": CompanyProfile.query.count(),
        "drives": PlacementDrive.query.count(),
        "applications": Application.query.count()
    })


@admin_bp.route("/chart-stats")
@admin_required
def chart_stats():
    return jsonify({
        "students": {
            "active": User.query.filter_by(role=Role.STUDENT, is_blacklisted=False).count(),
            "blacklisted": User.query.filter_by(role=Role.STUDENT, is_blacklisted=True).count()
        },
        "companies": {
            "approved": CompanyProfile.query.filter_by(approval_status=ApprovalStatus.APPROVED).count(),
            "pending": CompanyProfile.query.filter_by(approval_status=ApprovalStatus.PENDING).count(),
            "blacklisted": CompanyProfile.query.filter_by(approval_status=ApprovalStatus.BLACKLISTED).count(),
            "rejected": CompanyProfile.query.filter_by(approval_status=ApprovalStatus.REJECTED).count()
        },
        "drives": {
            "approved": PlacementDrive.query.filter_by(status=DriveStatus.APPROVED).count(),
            "rejected": PlacementDrive.query.filter_by(status=DriveStatus.REJECTED).count(),
            "closed": PlacementDrive.query.filter_by(status=DriveStatus.CLOSED).count()
        }
    })


@admin_bp.route("/students")
@admin_required
@cache.cached(timeout=60, query_string=True)
def students():

    search = request.args.get("search", "")
    query = User.query.filter_by(role=Role.STUDENT)
    if search:
        query = query.outerjoin(StudentProfile).filter(
            User.name.like(f"%{search}%")
            | User.email.like(f"%{search}%")
            | StudentProfile.roll_number.like(f"%{search}%")
        )

    students = [{
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "roll_number": user.student_profile.roll_number,
        "is_blacklisted": user.is_blacklisted
    } for user in query.all()]

    return jsonify(students)


@admin_bp.route("/companies")
@admin_required
@cache.cached(timeout=60, query_string=True)
def companies():

    search = request.args.get("search", "")
    query = CompanyProfile.query
    if search:
        query = query.filter( CompanyProfile.company_name.like(f"%{search}%"))

    companies = [{
        "id": company.id,
        "user_id": company.user_id,
        "company_name": company.company_name,
        "website": company.website,
        "approval_status": company.approval_status.value,
        "is_blacklisted": company.user.is_blacklisted
    } for company in query.all()]
    return jsonify(companies)


@admin_bp.route("/drives")
@admin_required
@cache.cached(timeout=60, query_string=True)
def drives():

    drives = [{
        "id": drive.id,
        "company_name": drive.company.company_name,
        "job_title": drive.job_title,
        "salary_lpa": drive.salary_lpa,
        "application_deadline": str(drive.application_deadline),
        "status": drive.status.value
    } for drive in PlacementDrive.query.all()]
    return jsonify(drives)


@admin_bp.route("/applications")
@admin_required
@cache.cached(timeout=60, query_string=True)
def applications():

    applications = [{
        "id": application.id,
        "student_name": application.student.user.name,
        "company_name": application.drive.company.company_name,
        "job_title": application.drive.job_title,
        "status": application.status.value,
        "applied_at": str(application.applied_at)
    } for application in Application.query.all()]
    return jsonify(applications)


@admin_bp.route("/companies/<int:company_id>/status", methods=["POST"])
@admin_required
def company_status(company_id):

    company = CompanyProfile.query.get_or_404(company_id)
    data = request.get_json()
    company.approval_status = ApprovalStatus(data["status"])
    db.session.commit()
    cache.clear()
    return jsonify({"message": "Company status updated"})


@admin_bp.route("/drives/<int:drive_id>/status", methods=["POST"])
@admin_required
def drive_status(drive_id):

    drive = PlacementDrive.query.get_or_404(drive_id)
    data = request.get_json()
    drive.status = DriveStatus(data["status"])
    db.session.commit()
    cache.clear()
    return jsonify({"message": "Drive status updated"})


@admin_bp.route("/users/<int:user_id>/toggle-blacklist", methods=["POST"])
@admin_required
def blacklist(user_id):

    user = User.query.get_or_404(user_id)
    user.is_blacklisted = not user.is_blacklisted
    db.session.commit()
    cache.clear()
    return jsonify({"message": "Blacklist updated"})


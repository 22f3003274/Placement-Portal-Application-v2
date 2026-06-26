from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, create_refresh_token, jwt_required, get_jwt_identity
from app.extensions import db
from app.models import User, Role, StudentProfile, CompanyProfile, ApprovalStatus

auth_bp = Blueprint("auth", __name__)

# Login
@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    user = User.query.filter_by(email=data.get("email", "").strip().lower()).first()

    if not user or not user.check_password(data.get("password", "")):
        return jsonify({"error": "Invalid email or password"}), 401
    if user.is_blacklisted:
        return jsonify({"error": "Account blocked"}), 403
    if user.role == Role.COMPANY and user.company_profile and user.company_profile.approval_status != ApprovalStatus.APPROVED:
        return jsonify({"error": "Wait for admin approval!"}), 403

    return jsonify({
        "access_token": create_access_token(identity=str(user.id), additional_claims={"role": user.role.value}),
        "refresh_token": create_refresh_token(identity=str(user.id)),
        "user": {"id": user.id, "name": user.name, "email": user.email, "role": user.role.value}
    }), 200


# Student Registration
@auth_bp.route("/register/student", methods=["POST"])
def register_student():
    data = request.get_json()
    user = User(name=data["name"], email=data["email"].strip().lower(), phone=data.get("phone"), role=Role.STUDENT)
    user.set_password(data["password"])
    
    db.session.add(user)
    db.session.flush()
    db.session.add(StudentProfile(user_id=user.id))
    db.session.commit()
    
    return jsonify({"message": "Registration successful"}), 201


# Company Registration
@auth_bp.route("/register/company", methods=["POST"])
def register_company():
    data = request.get_json()
    user = User(name=data["name"], email=data["email"].strip().lower(), phone=data.get("phone"), role=Role.COMPANY)
    user.set_password(data["password"])
    
    db.session.add(user)
    db.session.flush()
    db.session.add(CompanyProfile(
        user_id=user.id, company_name=data["company_name"], location=data.get("location"), website=data.get("website")
    ))
    db.session.commit()
    
    return jsonify({"message": "Registration submitted for approval"}), 201


# Get Current User
@auth_bp.route("/i", methods=["GET"])
@jwt_required()
def get_me():
    user = User.query.get(int(get_jwt_identity()))
    res = {"id": user.id, "name": user.name, "email": user.email, "role": user.role.value}

    if user.role == Role.STUDENT and user.student_profile:
        sp = user.student_profile
        res["profile"] = {"roll_number": sp.roll_number, "branch": sp.branch, "year": sp.year, "cgpa": sp.cgpa, "skills": sp.skills}
    elif user.role == Role.COMPANY and user.company_profile:
        cp = user.company_profile
        res["profile"] = {"company_name": cp.company_name, "location": cp.location, "website": cp.website, "approval_status": cp.approval_status.value}

    return jsonify(res), 200


# Refresh Token
@auth_bp.route("/refresh", methods=["POST"])
@jwt_required(refresh=True)
def refresh_token():
    user = User.query.get(int(get_jwt_identity()))
    return jsonify({"access_token": create_access_token(identity=str(user.id), additional_claims={"role": user.role.value})}), 200

from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    jwt_required,
    get_jwt_identity,
    get_jwt,
)
from app.extensions import db
from app.models import User, Role, StudentProfile, CompanyProfile, ApprovalStatus

# auth Blueprint
auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()

    # Basic field validation
    if not data or not data.get("email") or not data.get("password"):
        return jsonify({"error": "Email and password are required"}), 400

    email = data["email"].strip().lower()
    password = data["password"]

    # Find user by email
    user = User.query.filter_by(email=email).first()

    if not user or not user.check_password(password):
        return jsonify({"error": "Invalid email or password"}), 401

    # Block blacklisted users
    if user.is_blacklisted:
        return jsonify({"error": "Your account has been blacklisted. Contact admin."}), 403

    # Block inactive users
    if not user.is_active:
        return jsonify({"error": "Your account is inactive. Contact admin."}), 403

    # Company must be approved before they can log in
    if user.role == Role.COMPANY:
        profile = CompanyProfile.query.filter_by(user_id=user.id).first()
        if profile and profile.approval_status != ApprovalStatus.APPROVED:
            return jsonify({
                "error": "Your company registration is pending admin approval.",
                "approval_status": profile.approval_status.value
            }), 403

    # Create JWT tokens — identity is the user's id (as string)
    access_token = create_access_token(
        identity=str(user.id),
        additional_claims={"role": user.role.value}  # embed role in token
    )
    refresh_token = create_refresh_token(identity=str(user.id))

    return jsonify({
        "message": "Login successful",
        "access_token": access_token,
        "refresh_token": refresh_token,
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role.value
        }
    }), 200



@auth_bp.route("/register/student", methods=["POST"])
def register_student():
    data = request.get_json() or {}
    email = data.get("email", "").strip().lower()
    name = data.get("name", "").strip()
    password = data.get("password")

    if not name or not email or not password:
        return jsonify({"error": "Missing name, email, or password"}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Email already registered"}), 409

    # Create user account
    new_user = User(name=name, email=email, phone=data.get("phone"), role=Role.STUDENT)
    new_user.set_password(password)
    db.session.add(new_user)
    db.session.flush()  # Get new_user.id

    # Create empty profile
    db.session.add(StudentProfile(user_id=new_user.id))
    db.session.commit()

    return jsonify({"message": "Student registration successful. You can now log in."}), 201


@auth_bp.route("/register/company", methods=["POST"])
def register_company():
    data = request.get_json() or {}
    email = data.get("email", "").strip().lower()
    name = data.get("name", "").strip()
    company_name = data.get("company_name", "").strip()
    password = data.get("password")

    if not name or not company_name or not email or not password:
        return jsonify({"error": "Missing required fields"}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Email already registered"}), 409

    if CompanyProfile.query.filter_by(company_name=company_name).first():
        return jsonify({"error": "Company name already registered"}), 409

    # Create company user
    new_user = User(name=name, email=email, phone=data.get("phone"), role=Role.COMPANY)
    new_user.set_password(password)
    db.session.add(new_user)
    db.session.flush()

    # Create company profile
    company_profile = CompanyProfile(
        user_id=new_user.id,
        company_name=company_name,
        location=data.get("location"),
        website=data.get("website")
    )
    db.session.add(company_profile)
    db.session.commit()

    return jsonify({
        "message": "Company registration submitted. Please wait for admin approval before logging in."
    }), 201


@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def get_me():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)

    if not user:
        return jsonify({"error": "User not found"}), 404

    # Basic user info
    response = {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role.value,
        "is_active": user.is_active,
        "is_blacklisted": user.is_blacklisted
    }

    # Attach profile info based on role
    if user.role == Role.STUDENT and user.student_profile:
        sp = user.student_profile
        response["profile"] = {
            "roll_number": sp.roll_number,
            "branch": sp.branch,
            "year": sp.year,
            "cgpa": sp.cgpa,
            "skills": sp.skills
        }

    elif user.role == Role.COMPANY and user.company_profile:
        cp = user.company_profile
        response["profile"] = {
            "company_name": cp.company_name,
            "location": cp.location,
            "website": cp.website,
            "approval_status": cp.approval_status.value
        }

    return jsonify(response), 200


@auth_bp.route("/refresh", methods=["POST"])
@jwt_required(refresh=True)
def refresh_token():
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))

    if not user:
        return jsonify({"error": "User not found"}), 404

    # Issue a fresh access token
    new_access_token = create_access_token(
        identity=str(user.id),
        additional_claims={"role": user.role.value}
    )

    return jsonify({"access_token": new_access_token}), 200

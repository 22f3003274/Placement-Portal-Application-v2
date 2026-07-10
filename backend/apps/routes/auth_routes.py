from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from functools import wraps
from apps.extensions import db, cache
from apps.models import User, Role, StudentProfile, CompanyProfile, ApprovalStatus


auth_bp = Blueprint("auth", __name__)

def role_required(role):
    def decorator(function):

        @wraps(function)
        @jwt_required()
        def check_role(*args, **kwargs):

            user_id = get_jwt_identity()
            user = User.query.get(int(user_id))
            if not user or user.is_blacklisted or user.role != role:
                return jsonify({"error": "Access denied"}), 403

            return function(*args, **kwargs)
        return check_role
    return decorator

admin_required = role_required(Role.ADMIN)
company_required = role_required(Role.COMPANY)
student_required = role_required(Role.STUDENT)


@auth_bp.route("/login", methods=["POST"])
def login():

    data = request.get_json()
    email = data["email"].strip().lower()
    password = data["password"]

    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return jsonify({"error": "Invalid email or password"}), 401
    if user.is_blacklisted:
        return jsonify({"error": "Account blocked"}), 403
    if user.role == Role.COMPANY:
        if user.company_profile.approval_status != ApprovalStatus.APPROVED:
            return jsonify({"error": "Wait for admin approval"}), 403

    token = create_access_token(identity=str(user.id))
    return jsonify({"access_token": token, "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role.value
        }
    }), 200


@auth_bp.route("/register/student", methods=["POST"])
def register_student():

    data = request.get_json()
    user = User(
        name=data["name"],
        email=data["email"].strip().lower(),
        role=Role.STUDENT
    )
    user.set_password(data["password"])
    db.session.add(user)
    db.session.flush()

    student = StudentProfile(user_id=user.id)
    db.session.add(student)
    db.session.commit()
    cache.clear()

    return jsonify({"message": "Registration successful"}), 201


@auth_bp.route("/register/company", methods=["POST"])
def register_company():

    data = request.get_json()
    user = User(
        name=data["name"],
        email=data["email"].strip().lower(),
        role=Role.COMPANY
    )
    user.set_password(data["password"])
    db.session.add(user)
    db.session.flush()

    company = CompanyProfile(
        user_id=user.id,
        company_name=data["company_name"]
    )
    db.session.add(company)
    db.session.commit()
    cache.clear()

    return jsonify({"message": "Registration submitted for approval"}), 201


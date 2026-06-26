from functools import wraps
from flask import jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models import User, Role

def role_required(required_role):
    #decorator to check JWT identity, user active/blacklist status, and role.
    def decorator(fn):
        @wraps(fn)
        @jwt_required()
        def wrapper(*args, **kwargs):
            user = User.query.get(int(get_jwt_identity()))
            
            # User must exist, be active, and not blacklisted.
            if not user or not user.is_active or user.is_blacklisted:
                return jsonify({"error": "Unauthorized or inactive account"}), 403
                
            # Checking if user role matches the required role
            if user.role != required_role:
                return jsonify({"error": f"{required_role.value.capitalize()} access required"}), 403
                
            return fn(*args, **kwargs)
        return wrapper
    return decorator


admin_required = role_required(Role.ADMIN)
company_required = role_required(Role.COMPANY)
student_required = role_required(Role.STUDENT)


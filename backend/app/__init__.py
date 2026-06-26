from flask import Flask
from flask_cors import CORS
from app.config import Config
from app.extensions import db, jwt

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    CORS(app)

    db.init_app(app)
    jwt.init_app(app)

    from app.routes.auth import auth_bp
    app.register_blueprint(auth_bp, url_prefix="/api/auth")

    with app.app_context():
        from app.models import User, Role
        db.create_all()
        print("Database tables created.")
        _seed_admin(User, Role)

    return app


def _seed_admin(User, Role):
    existing = User.query.filter_by(role=Role.ADMIN).first()

    if not existing:
        admin = User(name="Admin", email="admin@ppa.com", role=Role.ADMIN, is_active=True, is_blacklisted=False)
        admin.set_password("admin")
        db.session.add(admin)
        db.session.commit()

        print("Admin user created: admin@ppa.com / admin")

    else:
        print("Admin already exists: admin@ppa.com / admin")

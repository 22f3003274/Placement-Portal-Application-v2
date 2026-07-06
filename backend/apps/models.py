from apps.extensions import db
from enum import Enum
from datetime import datetime, timezone
from werkzeug.security import generate_password_hash, check_password_hash


class Role(Enum):
    ADMIN   = "admin"
    STUDENT = "student"
    COMPANY = "company"

class ApprovalStatus(Enum):
    PENDING     = "pending"
    APPROVED    = "approved"
    REJECTED    = "rejected"
    BLACKLISTED = "blacklisted"

class DriveStatus(Enum):
    PENDING  = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    CLOSED   = "closed"

class JobType(Enum):
    FULL_TIME = "full_time"
    INTERN    = "intern"

class ApplicationStatus(Enum):
    APPLIED     = "applied"
    SHORTLISTED = "shortlisted"
    INTERVIEW   = "interview"
    OFFER       = "offer"
    REJECTED    = "rejected"
    PLACED      = "placed"


class UserMixin(db.Model):      
    __abstract__ = True                                          # abstract base model

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(256), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    phone = db.Column(db.String(20), nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def set_password(self, raw_password):
        self.password = generate_password_hash(raw_password)
    def check_password(self, raw_password):
        return check_password_hash(self.password, raw_password)


class User(UserMixin):
    __tablename__ = "users"                                      # inherited from UserMixin

    role = db.Column(db.Enum(Role), nullable=False)
    is_blacklisted = db.Column(db.Boolean, default=False)

    student_profile = db.relationship("StudentProfile", back_populates="user", uselist=False)
    company_profile = db.relationship("CompanyProfile", back_populates="user", uselist=False)

    def __repr__(self):
        return f"<User {self.email} | {self.role.value}>"
    # User 1 ─── 1 StudentProfile
    # User 1 ─── 1 CompanyProfile


class StudentProfile(db.Model):
    __tablename__ = "student_profiles"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), unique=True, nullable=False)
    roll_number = db.Column(db.String(20), unique=True, nullable=True)
    branch = db.Column(db.String(100), nullable=True)
    year = db.Column(db.Integer, nullable=True)
    cgpa = db.Column(db.Float, default=0.0)
    skills = db.Column(db.Text, nullable=True)
    resume = db.Column(db.String(200), nullable=True)
    updated_at = db.Column(db.DateTime,default=lambda: datetime.now(timezone.utc),onupdate=lambda: datetime.now(timezone.utc))

    user = db.relationship("User", back_populates="student_profile")
    applications = db.relationship("Application", back_populates="student", cascade="all, delete-orphan")
    placements = db.relationship("Placement", back_populates="student")

    def __repr__(self):
        return f"<StudentProfile {self.roll_number}>"
# Student 1 ─── N Applications
# Student 1 ─── N Placements



class CompanyProfile(db.Model):
    __tablename__ = "company_profiles"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), unique=True, nullable=False)
    company_name = db.Column(db.String(150), unique=True, nullable=False)
    location = db.Column(db.String(100), nullable=True)
    website = db.Column(db.String(200), nullable=True)
    hr_email = db.Column(db.String(120), nullable=True)
    hr_phone = db.Column(db.String(20), nullable=True)
    approval_status = db.Column(db.Enum(ApprovalStatus), default=ApprovalStatus.PENDING, nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    user = db.relationship("User", back_populates="company_profile")
    drives = db.relationship("PlacementDrive", back_populates="company", cascade="all, delete-orphan")
    placements = db.relationship("Placement", back_populates="company")

    def __repr__(self):
        return f"<CompanyProfile {self.company_name} | {self.approval_status.value}>"
# Company 1 ─── N PlacementDrives
# Company 1 ─── N Placements



class PlacementDrive(db.Model):
    __tablename__ = "placement_drives"

    id = db.Column(db.Integer, primary_key=True)
    company_id = db.Column(db.Integer, db.ForeignKey("company_profiles.id"), nullable=False)
    job_title = db.Column(db.String(200), nullable=False)
    job_description = db.Column(db.Text, nullable=True)
    eligibility_criteria = db.Column(db.Text, nullable=True)
    salary_lpa = db.Column(db.Float, nullable=True)
    application_deadline = db.Column(db.Date, nullable=False)
    drive_date = db.Column(db.Date, nullable=True)
    location = db.Column(db.String(100), nullable=True)
    job_type = db.Column(db.Enum(JobType), default=JobType.FULL_TIME)
    status = db.Column(db.Enum(DriveStatus), default=DriveStatus.PENDING)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    company      = db.relationship("CompanyProfile", back_populates="drives")
    applications = db.relationship("Application", back_populates="drive", cascade="all, delete-orphan")
    placements   = db.relationship("Placement", back_populates="drive")

    def __repr__(self):
        return f"<PlacementDrive '{self.job_title}' | {self.status.value}>"
# PlacementDrive 1 ─── N Applications



class Application(db.Model):
    __tablename__ = "applications"

    id = db.Column(db.Integer, primary_key=True)
    drive_id = db.Column(db.Integer, db.ForeignKey("placement_drives.id"), nullable=False)
    student_id = db.Column(db.Integer, db.ForeignKey("student_profiles.id"), nullable=False)
    status = db.Column(db.Enum(ApplicationStatus), default=ApplicationStatus.APPLIED, nullable=False)
    applied_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    interview_date = db.Column(db.DateTime, nullable=True)
    feedback = db.Column(db.Text, nullable=True)
    history = db.Column(db.JSON, default=list)
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    __table_args__ = (db.UniqueConstraint("student_id", "drive_id", name="uq_student_drive"),)

    student = db.relationship("StudentProfile", back_populates="applications")
    drive = db.relationship("PlacementDrive", back_populates="applications")
    placement = db.relationship("Placement", back_populates="application", uselist=False)

    def __repr__(self):
        return f"<Application student={self.student_id} drive={self.drive_id} | {self.status.value}>"

# Application 1 ─── 0 or 1 Placement
# to be created when a student applies to a placement drive.
# status flow: applied → shortlisted → interview → offer → placed
#                                               ↘ rejected (at any step)
# student can only withdraw when status is APPLIED.


class Placement(db.Model):
    __tablename__ = "placements"

    id = db.Column(db.Integer, primary_key=True)
    application_id = db.Column(db.Integer, db.ForeignKey("applications.id"), unique=True, nullable=False)
    company_id = db.Column(db.Integer, db.ForeignKey("company_profiles.id"), nullable=False)
    student_id = db.Column(db.Integer, db.ForeignKey("student_profiles.id"), nullable=False)
    drive_id = db.Column(db.Integer, db.ForeignKey("placement_drives.id"), nullable=False)
    job_title = db.Column(db.String(200), nullable=False)
    salary_lpa = db.Column(db.Float, nullable=True)
    joining_date = db.Column(db.Date, nullable=True)
    placed_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    offer_letter = db.Column(db.String(300), nullable=True)
    
    application = db.relationship("Application", back_populates="placement")
    student = db.relationship("StudentProfile", back_populates="placements")
    company = db.relationship("CompanyProfile", back_populates="placements")
    drive = db.relationship("PlacementDrive", back_populates="placements")

    def __repr__(self):
        return f"<Placement student={self.student_id} company={self.company_id}>"

# Final confirmed record when a student is placed.
# to be created when company sets application status to PLACED.


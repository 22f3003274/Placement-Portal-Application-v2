import csv
import os
import time
from datetime import date, timedelta
from celery.schedules import crontab
from apps.extensions import mail
from apps.celery_workers import celery
from apps.models import Application, Placement, ApplicationStatus, StudentProfile, CompanyProfile, Role, User, PlacementDrive
from flask_mail import Message

celery.conf.beat_schedule = {
    "daily-reminder": {
        "task": "apps.tasks.send_interview_reminders",
        "schedule": crontab(hour=8, minute=0)
    },
    "monthly-report": {
        "task": "apps.tasks.generate_monthly_report",
        "schedule": crontab(day_of_month=1, hour=8, minute=0)
    }
}

@celery.task
def send_interview_reminders():

    tomorrow = date.today() + timedelta(days=1)
    applications = Application.query.all()

    for app in applications:
        if (app.status == ApplicationStatus.INTERVIEW
            and app.interview_date is not None
            and app.interview_date.date() == tomorrow):

            student_email = app.student.user.email
            msg = Message(
                subject="Interview Reminder",
                recipients=[student_email],
                body=f"You have an interview scheduled for the role of {app.drive.job_title} at {app.drive.company.company_name} tomorrow!"
            )
            mail.send(msg)

    return "Reminded all students for interview"                
                    

@celery.task
def generate_monthly_report():
    from apps.models import User, Role, PlacementDrive

    admin = User.query.filter_by(role=Role.ADMIN).first()

    month = date.today().strftime("%B")
    year = date.today().year
    total_drives = PlacementDrive.query.count()
    total_applications = Application.query.count()
    total_placements = Placement.query.count()

    html = f"""
    <h1>Monthly Placement Report For: {month} {year}</h1>

    <p>Total Drives: {total_drives}</p>
    <p>Total Applications: {total_applications}</p>
    <p>Total Students Selected: {total_placements}</p>
    """

    msg = Message(
        subject="Monthly Placement Report",
        recipients=[admin.email],
        html=html
    )

    mail.send(msg)
    return "Monthly report sent to admin."


@celery.task
def export_csv_data(user_id, role):
    os.makedirs("static/exports", exist_ok=True)

    filename = f"export_{role}_{user_id}.csv"
    file_path = os.path.join("static/exports", filename)

    if role == "student":
        applications = Application.query.filter(Application.student.has(user_id=user_id)).all()

        headings = ["Drive", "Company", "Status", "Applied At"]
        rows = [[
            app.drive.job_title,
            app.drive.company.company_name,
            app.status.value,
            app.applied_at
        ] for app in applications]

    elif role == "company":
        applications = Application.query.filter(Application.drive.has(company_id=user_id)).all()

        headings = ["Student", "Job Title", "Status", "Applied At"]
        rows = [[
            app.student.user.name,
            app.drive.job_title,
            app.status.value,
            app.applied_at
        ] for app in applications]

    else:
        return None

    with open(file_path, "w", newline="") as file:
        writer = csv.writer(file)
        writer.writerow(headings)
        writer.writerows(rows)

    return file_path

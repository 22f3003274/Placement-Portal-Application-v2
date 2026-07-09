import csv
import os
from datetime import datetime, date, timedelta
from celery.schedules import crontab
from apps.extensions import mail
from apps.celery_workers import celery
from apps.models import Application, Placement, ApplicationStatus
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
    applications = Application.query.filter_by(status=ApplicationStatus.INTERVIEW).all()
    count = 0
    for application in applications:
        if application.interview_date and application.interview_date.date() == tomorrow:
            email = application.student.user.email
            job = application.drive.job_title
            company = application.drive.company.company_name
            
            msg = Message(
                subject="Upcoming Interview Reminder",
                recipients=[email],
                body=f"Hello {application.student.user.name},\n\nYou have an interview scheduled tomorrow for {job} at {company}!\n\nGood luck!"
            )
            mail.send(msg)
            count += 1
    return f"Sent {count} reminders."

@celery.task
def generate_monthly_report():
    from apps.models import CompanyProfile, DriveStatus, ApprovalStatus
    
    companies = CompanyProfile.query.filter_by(approval_status=ApprovalStatus.APPROVED).all()
    count = 0
    os.makedirs("static/exports", exist_ok=True)
    
    for company in companies:
        drives = [d.id for d in company.drives]
        total_applications = Application.query.filter(Application.drive_id.in_(drives)).count()
        total_placements = Placement.query.filter(Placement.company_id == company.id).count()
        
        html_content = f"""
        <html>
            <body>
                <h1>Monthly Placement Report: {company.company_name}</h1>
                <p>Generated on: {datetime.now().strftime("%Y-%m-%d %H:%M")}</p>
                <h3>Your Analytics</h3>
                <ul>
                    <li>Total Applications Received: {total_applications}</li>
                    <li>Total Successful Placements: {total_placements}</li>
                </ul>
            </body>
        </html>
        """
        
        file_path = os.path.join("static/exports", f"monthly_report_{company.id}_{datetime.now().strftime('%Y%m%d')}.html")
        with open(file_path, "w") as f:
            f.write(html_content)
            
        msg = Message(
            subject=f"Monthly Placement Analytics for {company.company_name}",
            recipients=[company.user.email],
            body=f"Please find attached your monthly placement analytics report."
        )
        with open(file_path, "rb") as fp:
            msg.attach(f"monthly_report_{company.id}.html", "text/html", fp.read())
            
        mail.send(msg)
        count += 1
        
    return f"Sent {count} monthly reports to companies."

@celery.task
def export_csv_data(user_id, role):
    os.makedirs("static/exports",exist_ok=True)
    filename = "export_"+ role + "_" + str(user_id) + "_" + datetime.now().strftime("%Y%m%d%H%M%S") + ".csv"
    file_path = os.path.join("static/exports",filename)

    if role == "student":
        applications = Application.query.filter(Application.student.has(user_id=user_id)).all()

        with open(file_path, "w", newline="") as file:
            writer = csv.writer(file)
            writer.writerow([
                "Drive",
                "Company",
                "Status",
                "Applied At"
            ])

            for application in applications:
                writer.writerow([
                    application.drive.job_title,
                    application.drive.company.company_name,
                    application.status.value,
                    application.applied_at
                ])


    if role == "company":
        applications = Application.query.filter(Application.drive.has(company_id=user_id)).all()
        with open(file_path, "w", newline="") as file:
            writer = csv.writer(file)
            writer.writerow([
                "Student",
                "Job Title",
                "Status",
                "Applied At"
            ])

            for application in applications:
                writer.writerow([
                    application.student.user.name,
                    application.drive.job_title,
                    application.status.value,
                    application.applied_at
                ])

    return file_path


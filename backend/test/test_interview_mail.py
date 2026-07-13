import sys
sys.path.append("..")
from app import create_app
from apps.tasks import send_interview_reminders

app = create_app()
with app.app_context():
    print(send_interview_reminders())

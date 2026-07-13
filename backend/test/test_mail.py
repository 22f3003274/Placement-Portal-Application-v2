import sys
sys.path.append("..")
from app import create_app
from apps.extensions import mail
from flask_mail import Message

app = create_app()
with app.app_context():
    msg = Message(subject="Placement Portal Application - Test Email", recipients=["test@student.com"], body="This is a test mail.")
    mail.send(msg)
    print("Check mail at http://localhost:8025")
    
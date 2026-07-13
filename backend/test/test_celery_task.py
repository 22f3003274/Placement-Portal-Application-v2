import sys
sys.path.append("..")
from app import create_app
from apps.tasks import generate_monthly_report

app = create_app()
with app.app_context():
    print(generate_monthly_report())

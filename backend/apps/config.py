from datetime import timedelta

class Config:
    SECRET_KEY = "ppa-secret-key"

    SQLALCHEMY_DATABASE_URI = "sqlite:///ppa.db"
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    JWT_SECRET_KEY = "ppa-jwt-secret-key"
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)

    DEBUG = True

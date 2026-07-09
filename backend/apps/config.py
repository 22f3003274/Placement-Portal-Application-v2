from datetime import timedelta

class Config:
    SECRET_KEY = "ppa-secret-key"

    SQLALCHEMY_DATABASE_URI = "sqlite:///ppa.db"
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    JWT_SECRET_KEY = "ppa-jwt-secret-key"
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)

    DEBUG = True

    MAIL_SERVER = '127.0.0.1'
    MAIL_PORT = 1025
    MAIL_USE_TLS = False
    MAIL_USE_SSL = False
    MAIL_DEFAULT_SENDER = 'ppa@ppa.com'

    CACHE_TYPE = 'RedisCache'
    CACHE_REDIS_URL = 'redis://localhost:6379/0'
    CACHE_DEFAULT_TIMEOUT = 60

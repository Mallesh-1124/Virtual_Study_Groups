"""
Django settings for Virtual Study Group project.
"""
import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env file
load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.getenv('SECRET_KEY', 'django-insecure-default-key-for-dev-only')

DEBUG = os.getenv('DEBUG', 'False').lower() == 'true'

ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', '*').split(',')

# Application definition
INSTALLED_APPS = [
    'daphne',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    # Third party
    'rest_framework',
    'corsheaders',
    # Local
    'api.apps.ApiConfig',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'
ASGI_APPLICATION = 'config.asgi.application'

import dj_database_url

# Database Settings
# Priority 1: Use DATABASE_URL or MYSQL_URL if available (Railway sets these)
db_url = os.getenv('DATABASE_URL') or os.getenv('MYSQL_URL')

if db_url:
    # dj-database-url natively supports mysql:// scheme — no rewriting needed
    
    DATABASES = {
        'default': dj_database_url.parse(db_url)
    }
    DATABASES['default']['CONN_MAX_AGE'] = 600
    print(f"[DB] Using DATABASE_URL -> Host: {DATABASES['default'].get('HOST')}")

# Priority 2: Use Railway's individual MYSQL* variables
elif os.getenv('MYSQLHOST'):
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.mysql',
            'NAME': os.getenv('MYSQLDATABASE', 'railway'),
            'USER': os.getenv('MYSQLUSER', 'root'),
            'PASSWORD': os.getenv('MYSQLPASSWORD', ''),
            'HOST': os.getenv('MYSQLHOST'),
            'PORT': os.getenv('MYSQLPORT', '3306'),
        }
    }
    print(f"[DB] Using MYSQLHOST -> Host: {DATABASES['default']['HOST']}")

# Priority 3: Google Cloud Run with Cloud SQL unix socket
elif os.getenv('K_SERVICE'):
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.mysql',
            'NAME': os.getenv('DB_NAME', 'virtual_study_group'),
            'USER': os.getenv('DB_USER', 'root'),
            'PASSWORD': os.getenv('DB_PASSWORD', ''),
            'HOST': f"/cloudsql/{os.getenv('DB_HOST')}",
        }
    }
    print(f"[DB] Using Cloud SQL -> Host: {DATABASES['default']['HOST']}")

# Priority 4: Local development (from .env file)
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.mysql',
            'NAME': os.getenv('DB_NAME', 'virtual_study_group'),
            'USER': os.getenv('DB_USER', 'root'),
            'PASSWORD': os.getenv('DB_PASSWORD', ''),
            'HOST': os.getenv('DB_HOST', 'localhost'),
            'PORT': os.getenv('DB_PORT', '3306'),
        }
    }
    print(f"[DB] Using local config -> Host: {DATABASES['default']['HOST']}")


# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
]

# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# Static files
STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# CORS — allow frontend origins
_cors_origins = os.getenv(
    'CORS_ALLOWED_ORIGINS',
    'http://localhost:3000,http://127.0.0.1:3000'
).split(',')
CORS_ALLOWED_ORIGINS = [o.strip() for o in _cors_origins if o.strip()]
CORS_ALLOW_CREDENTIALS = True

# Django REST Framework
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'api.authentication.CsrfExemptSessionAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticatedOrReadOnly',
    ],
}

# Django Channels — in-memory layer for dev
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels.layers.InMemoryChannelLayer',
    },
}

# Session & CSRF cookie settings
# In production (cross-origin), cookies need SameSite=None + Secure
_is_production = not DEBUG
if _is_production:
    SESSION_COOKIE_SAMESITE = 'None'
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SAMESITE = 'None'
    CSRF_COOKIE_SECURE = True
else:
    SESSION_COOKIE_SAMESITE = 'Lax'
    CSRF_COOKIE_SAMESITE = 'Lax'

# CSRF trusted origins — include all CORS origins + any extras
CSRF_TRUSTED_ORIGINS = CORS_ALLOWED_ORIGINS + [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
]


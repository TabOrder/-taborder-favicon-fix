#!/usr/bin/env python3
"""
Setup script for TabOrder Flask Application
This file helps Render and other tools recognize this as a Python project
"""
from setuptools import setup, find_packages

setup(
    name="taborder-flask-app",
    version="1.0.0",
    description="TabOrder USSD and Web Application",
    author="TabOrder Team",
    packages=find_packages(),
    install_requires=[
        "Flask==2.3.3",
        "Flask-CORS==4.0.0",
        "gunicorn==21.2.0",
        "psycopg2-binary==2.9.7",
        "redis==4.6.0",
        "requests==2.31.0",
        "python-dotenv==1.0.0",
    ],
    python_requires=">=3.9",
) 
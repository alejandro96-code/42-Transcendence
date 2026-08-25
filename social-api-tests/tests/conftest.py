# tests/conftest.py

import os

from dotenv import load_dotenv

load_dotenv()

API_BASE_URL = os.environ["API_BASE_URL"]
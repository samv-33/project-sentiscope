import os
import json
from dotenv import load_dotenv
import firebase_admin
from firebase_admin import credentials, firestore, auth as firebase_auth

# Load .env for local development (optional)
load_dotenv()

# Read the service account JSON from an environment variable
service_account_json = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON")
if not service_account_json:
    raise RuntimeError("Missing FIREBASE_SERVICE_ACCOUNT_JSON environment variable")

# Parse the JSON and initialize Firebase
sa_info = json.loads(service_account_json)
cred = credentials.Certificate(sa_info)
app = firebase_admin.initialize_app(cred)

# Get Firestore client
db = firestore.client(app=app)

# Get Auth client
auth = firebase_auth.Client(app=app)

print("Firebase initialized successfully!")

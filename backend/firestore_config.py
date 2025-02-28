import os
from dotenv import load_dotenv
import firebase_admin

from firebase_admin import credentials, firestore, auth

load_dotenv()

firebase_private_key_path = os.getenv('FIREBASE_PRIVATE_KEY_PATH')


#Initialize Firebase
cred = credentials.Certificate("sentiscope-334be-firebase-adminsdk-fbsvc-234f1902ca.json")
app = firebase_admin.initialize_app(cred)


#Get Firestore client
db = firestore.client(app=app)

print("Firebase initialized successfully!")
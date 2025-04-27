import firebase_admin
from firebase_admin import credentials, db
from dotenv import load_dotenv
import os

# Load environment variables from the .env file
load_dotenv()

# Initialize Firebase only once
if not firebase_admin._apps:
    # Fetch the credentials from environment variables
    cred_dict = {
        "type": os.getenv("TYPE"),
        "project_id": os.getenv("PROJECT_ID"),
        "private_key_id": os.getenv("PRIVATE_KEY_ID"),
        "private_key": os.getenv("PRIVATE_KEY").replace('\\n', '\n'),
        "client_email": os.getenv("CLIENT_EMAIL"),
        "client_id": os.getenv("CLIENT_ID"),
        "auth_uri": os.getenv("AUTH_URI"),
        "token_uri": os.getenv("TOKEN_URI"),
        "auth_provider_x509_cert_url": os.getenv("AUTH_PROVIDER_X509_CERT_URL"),
        "client_x509_cert_url": os.getenv("CLIENT_X509_CERT_URL")
    }

    cred = credentials.Certificate(cred_dict)
    firebase_admin.initialize_app(cred, {
        'databaseURL': 'https://contech-c5fd5-default-rtdb.firebaseio.com/'
    })

def get_sensor_data():
    try:
        # Ensure correct reference to the 'sensorData' node in Firebase Realtime Database
        ref = db.reference('/sensorData')  # This points to the path of your sensor data
        data = ref.get()

        if data:
            print("🔥 Fetched data from Firebase:", data)
        else:
            print("No data found.")
        
        return data

    except Exception as e:
        print("Error fetching data from Firebase:", e)
        return None

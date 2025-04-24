import firebase_admin
from firebase_admin import credentials, db

# Initialize Firebase only once
if not firebase_admin._apps:
    cred = credentials.Certificate("firebase_config.json")
    firebase_admin.initialize_app(cred, {
        'databaseURL': 'https://contech-c5fd5-default-rtdb.firebaseio.com/'
    })

def get_sensor_data():
    ref = db.reference('/sensorData')  # ← this was the issue
    data = ref.get()
    print("🔥 Fetched data from Firebase:", data)
    return data

from flask import Flask, render_template, request, redirect, url_for, session, flash, send_file, jsonify
from flask_sqlalchemy import SQLAlchemy
import os
import csv
from datetime import datetime
from firebase_data import get_sensor_data
from dotenv import load_dotenv

# ------------------- LOAD .env -------------------
load_dotenv()  # ✅ This will load .env file in your root directory

app = Flask(__name__)
app.secret_key = os.getenv("FLASK_SECRET_KEY", "fallback_secret")  # ✅ Use secret from .env

# ------------------- DATABASE CONFIG -------------------
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///contech.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)


app = Flask(__name__)
app.secret_key = "your_secret_key"

# ------------------- DATABASE CONFIG -------------------
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///contech.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# ------------------- MODELS -------------------
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(100), nullable=False)

class ContactMessage(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), nullable=False)
    message = db.Column(db.Text, nullable=False)

# Create tables
with app.app_context():
    db.create_all()

# ------------------- ROUTES -------------------

@app.route("/")
def home():
    messages = session.pop("flash_messages", [])
    return render_template("home.html", user=session.get("user"), messages=messages)

@app.route("/about")
def about():
    return render_template("about.html")

@app.route("/visuals")
def visuals():
    sensor_data = get_sensor_data()
    return render_template("visuals.html", sensor_data=sensor_data)

# Real-time endpoint for AJAX calls
@app.route("/get-latest-sensor-data")
def get_latest_sensor_data():
    data = get_sensor_data()
    return jsonify(data)

@app.route("/export-data")
def export_data():
    value = get_sensor_data()

    if not value:
        flash("No data available to export.", "warning")
        return redirect(url_for("visuals"))


    headers = ["Time", "Environment Temperature", "Mixture Temperature", "Humidity", "Moisture"]
    row = [
        value.get("time", "N/A"),
        value.get("etemp", "N/A"),
        value.get("mtemp", "N/A"),
        value.get("humidity", "N/A"),
        value.get("moisture", "N/A")
    ]
    

    timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    filename = f"sensor_data_{timestamp}.csv"
    file_path = os.path.join("static", filename)

    with open(file_path, "w", newline="") as file:
        writer = csv.writer(file)
        writer.writerow(headers)
        writer.writerow(row)

    return send_file(file_path, as_attachment=True, download_name=filename)

@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        username = request.form["username"]
        password = request.form["password"]
        user = User.query.filter_by(username=username, password=password).first()

        if user:
            session["user"] = user.username
            session["flash_messages"] = [("info", "Successfully logged in!")]
            flash("Successfully logged in")
            return redirect(url_for("home"))
        else:
            flash("Invalid username or password", "danger")
            return redirect(url_for("login"))

    return render_template("login.html")

@app.route("/signup", methods=["GET", "POST"])
def signup():
    if request.method == "POST":
        username = request.form["username"]
        email = request.form["email"]
        password = request.form["password"]
        confirm_password = request.form["confirm_password"]

        if password != confirm_password:
            flash("Passwords do not match!", "danger")
            return redirect(url_for("signup"))

        existing_user = User.query.filter((User.username == username) | (User.email == email)).first()
        if existing_user:
            flash("Username or Email already exists!", "warning")
            return redirect(url_for("signup"))

        new_user = User(username=username, email=email, password=password)
        db.session.add(new_user)
        db.session.commit()

        flash("Signup successful! You can now do log in.", "success")
        return redirect(url_for("login"))

    return render_template("signup.html")

@app.route("/logout")
def logout():
    session.pop("user", None)
    session["flash_messages"] = [("info", "Successfully logged out!")]
    flash("Successfully logged out!")
    return redirect(url_for("home"))

@app.route("/contact", methods=["POST"])
def contact():
    name = request.form["name"]
    email = request.form["email"]
    message = request.form["message"]

    new_message = ContactMessage(name=name, email=email, message=message)
    db.session.add(new_message)
    db.session.commit()

    flash("Your message has been sent!", "success")
    return redirect(url_for("home"))

if __name__ == "__main__":
    app.run(debug=True)

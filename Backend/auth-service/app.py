from flask import Flask, request, jsonify, session
from flask_cors import CORS
import pymongo

app = Flask(__name__)
app.secret_key = 'supersecretkey'
CORS(app, supports_credentials=True, origins=["http://localhost:3000"])

# MongoDB setup
client = pymongo.MongoClient("mongodb://host.docker.internal:27017")
db = client["auth_db"]
users = db["users"]

@app.route("/signup", methods=["POST"])
def signup():
    data = request.json
    email = data.get("email")
    phone = data.get("phone")
    password = data.get("password")

    if users.find_one({"$or": [{"email": email}, {"phone": phone}]}):
        return jsonify({"error": "User already exists"}), 409

    users.insert_one({"email": email, "phone": phone, "password": password})
    return jsonify({"message": "Signup successful"}), 201

@app.route("/login", methods=["POST"])
def login():
    data = request.json
    identifier = data.get("identifier")  # email or phone
    password = data.get("password")

    user = users.find_one({
        "$or": [{"email": identifier}, {"phone": identifier}],
        "password": password
    })

    if user:
        session['user'] = user['email']
        return jsonify({
            "message": "Login successful",
            "email": user["email"],
            "phone": user["phone"]
        }), 200
    else:
        return jsonify({"error": "Invalid credentials"}), 401

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5000, debug=True)

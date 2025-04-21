from flask import Flask, request, jsonify
from flask_cors import CORS
import pusher
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

# CORS configuration (allows preflight and credentials)
CORS(app, supports_credentials=True, resources={r"/*": {"origins": [
    "http://localhost:3000"
]}})


# Pusher setup
pusher_client = pusher.Pusher(
    app_id=os.getenv("PUSHER_APP_ID"),
    key=os.getenv("PUSHER_KEY"),
    secret=os.getenv("PUSHER_SECRET"),
    cluster=os.getenv("PUSHER_CLUSTER"),
    ssl=True
)

@app.route("/send-push", methods=["POST", "OPTIONS"])
def send_push():
    if request.method == "OPTIONS":
        return jsonify({"status": "CORS preflight"}), 200

    data = request.json
    message = data.get("message", "No message")

    # Trigger push notification
    pusher_client.trigger("booking-channel", "booking-confirmed", {"message": message})
    return jsonify({"status": "Push notification sent"}), 200

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5004, debug=True)

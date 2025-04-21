from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime
from pymongo import MongoClient

app = Flask(__name__)
CORS(app, supports_credentials=True)

client = MongoClient("mongodb://host.docker.internal:27017")
db = client["pricing_db"]
price_collection = db["price_logs"]

BASE_PRICE = 1000
PEAK_MONTHS = [6, 12]  # June, December
POPULAR_DESTINATIONS = ["delhi", "mumbai", "bangalore", "goa", "manali"]

@app.route("/get-price", methods=["POST"])
def get_price():
    data = request.json
    destination = data.get("destination", "").lower()
    ticket_type = data.get("ticketType", "").lower()
    flight_date_str = data.get("flightDate")
    flight_time = data.get("flightTime", "").lower()

    try:
        flight_date = datetime.strptime(flight_date_str, "%Y-%m-%d")
    except:
        return jsonify({"error": "Invalid date format"}), 400

    month = flight_date.month
    price = BASE_PRICE

    # Ticket type
    if ticket_type == "business":
        price *= 1.5

    # Peak month
    if month in PEAK_MONTHS:
        price *= 1.2

    # Flight time
    if flight_time == "evening":
        price *= 1.15
    elif flight_time == "afternoon":
        price *= 1.10

    # Popular destination
    if destination in POPULAR_DESTINATIONS:
        price *= 1.15

    final_price = round(price, 2)

    price_collection.insert_one({
        "destination": destination,
        "ticketType": ticket_type,
        "flightDate": flight_date_str,
        "flightTime": flight_time,
        "final_price": final_price,
        "timestamp": datetime.now().isoformat()
    })

    return jsonify({"final_price": final_price})

@app.route("/package-price", methods=["POST"])
def package_price():
    package_data = request.json

    # Extract package info
    base_price = package_data.get("price", 0)
    destination = package_data.get("destination", "").lower()
    duration_str = package_data.get("duration", "0 days")
    tags = package_data.get("tags", [])
    bookings = package_data.get("bookings", 0)
    visitors = package_data.get("visitors", 0)
    dynamic_pricing_enabled = package_data.get("dynamicPricing", False)

    if not dynamic_pricing_enabled:
        return jsonify({
            "original_price": base_price,
            "finalPrice": base_price,
        })

    # Parse duration
    try:
        duration_days = int(duration_str.split()[0])
    except:
        duration_days = 0

    price = base_price
    pricing_factors = {}

    # Factor 1: Demand-based pricing
    conversion_rate = bookings / visitors if visitors > 0 else 0
    demand_multiplier = 1.0

    if conversion_rate > 0.08:
        demand_multiplier = 1.25
    elif conversion_rate > 0.05:
        demand_multiplier = 1.15
    elif conversion_rate > 0.03:
        demand_multiplier = 1.08
    elif conversion_rate < 0.01 and visitors > 100:
        demand_multiplier = 0.92

    price *= demand_multiplier
    pricing_factors["demand_multiplier"] = demand_multiplier

    # Factor 2: Destination popularity
    tier1_destinations = ["mumbai", "delhi", "bangalore", "goa", "jaipur", "agra"]
    tier2_destinations = ["hyderabad", "chennai", "kolkata", "pune", "manali", "shimla"]

    destination_multiplier = 1.0
    if destination in tier1_destinations:
        destination_multiplier = 1.15
    elif destination in tier2_destinations:
        destination_multiplier = 1.08

    price *= destination_multiplier
    pricing_factors["destination_multiplier"] = destination_multiplier

    # Factor 3: Duration
    duration_multiplier = 1.0
    if duration_days >= 7:
        duration_multiplier = 0.95
    elif duration_days <= 1:
        duration_multiplier = 1.12

    price *= duration_multiplier
    pricing_factors["duration_multiplier"] = duration_multiplier

    # Factor 4: Tags (only 4 supported)
    valid_tags = ["hill station", "relaxation", "adventure", "beach"]
    tag_multiplier = 1.0

    if any(tag.lower() == "adventure" for tag in tags):
        tag_multiplier = 1.12
    elif any(tag.lower() == "relaxation" for tag in tags):
        tag_multiplier = 1.08
    elif any(tag.lower() == "hill station" for tag in tags):
        tag_multiplier = 1.10
    elif any(tag.lower() == "beach" for tag in tags):
        tag_multiplier = 1.10

    price *= tag_multiplier
    pricing_factors["tag_multiplier"] = tag_multiplier

    # Final price
    finalPrice = round(price, 2)

    # Log to MongoDB
    log_entry = {
        "package_id": str(package_data.get("_id", "")),
        "destination": destination,
        "original_price": base_price,
        "finalPrice": finalPrice,
        "pricing_factors": pricing_factors,
        "conversion_metrics": {
            "bookings": bookings,
            "visitors": visitors,
            "conversion_rate": conversion_rate
        },
        "timestamp": datetime.now().isoformat()
    }

    price_collection.insert_one(log_entry)

    return jsonify({
        "original_price": base_price,
        "finalPrice": finalPrice,
        "pricing_factors": pricing_factors,
    })


if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5005, debug=True)

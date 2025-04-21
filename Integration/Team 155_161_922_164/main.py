from fastapi import FastAPI, HTTPException, Query
from typing import List, Dict, Any
import httpx

# Import services and core logic
from services import user_activity_service, festival_trend_service, traffic_analyzer
from core import rule_engine, offer_generator

app = FastAPI(title="Personalized Travel Offer Microservice")

EMAIL_SERVICE_URL = "http://bore.pub:30002/send-offer-email"

@app.get("/offers", response_model=List[Dict[str, Any]])
def get_personalized_offers(
    user_id: int = Query(..., description="The ID of the user to generate offers for"),
    test_email: str = Query(None, description="Optional test email to override user email")
):
    """Generates and emails personalized travel offers for a given user ID."""
    if not user_id:
        raise HTTPException(status_code=400, detail="user_id parameter is required")

    try:
        # 1. Fetch user activity and override email if testing
        user_data = user_activity_service.get_user_activity(4)
        if test_email:
            user_data["email"] = test_email

        # 2. Fetch trends and traffic data
        trends_data = festival_trend_service.get_festivals_and_trends()
        traffic_data = traffic_analyzer.get_trending_destinations()

        # 3. Apply rules and generate offers
        potential_destinations = rule_engine.apply_rules(user_data, trends_data, traffic_data)
        offers = offer_generator.generate_offers(potential_destinations)

        # 4. Send the offers as an email
        try:
            email_payload = {
                "user_id": user_id,
                "email": user_data.get("email"),
                "offers": offers
            }
            response = httpx.post(EMAIL_SERVICE_URL, json=email_payload, timeout=5.0)
            response.raise_for_status()
        except httpx.HTTPError as e:
            print(f"Failed to send email: {e}")
            # You can choose to still return offers even if email fails

        # 5. Return the offers
        return offers

    except Exception as e:
        print(f"Error generating offers for user {user_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error generating offers")

@app.get("/")
def read_root():
    return {"message": "Welcome to the Personalized Travel Offer Microservice! Visit /docs for API documentation."}
import random

def get_user_activity(user_id: int) -> dict:
    """Mock fetching user activity data including a real email for testing."""
    browsed = ["Paris", "Tokyo", "New York"] if user_id % 3 == 0 else ["London", "Rome"]
    wishlist = ["Maldives", "Kyoto"] if user_id % 2 == 0 else []
    past_bookings = ["Berlin"] if user_id % 4 == 0 else ["Sydney", "Barcelona"]

    return {
        "user_id": user_id,
        "email": "", #Email should be mentioned here
        "browsed_destinations": random.sample(browsed, k=min(len(browsed), 2)),
        "wishlist": wishlist,
        "past_bookings": random.sample(past_bookings, k=min(len(past_bookings), 1))
    }
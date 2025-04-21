import React, { useState, useEffect } from "react";
import axios from "axios";
import Pusher from "pusher-js";

const Home = () => {
  const [destination, setDestination] = useState("");
  const [ticketType, setTicketType] = useState("economy");
  const [flightDate, setFlightDate] = useState("");
  const [flightTime, setFlightTime] = useState("morning");
  const [price, setPrice] = useState(null);

  useEffect(() => {
    if (Notification.permission !== "granted") {
      Notification.requestPermission();
    }

    const pusher = new Pusher("", {
      cluster: "",
    });

    const channel = pusher.subscribe("booking-channel");

    channel.bind("booking-confirmed", function (data) {
      const msg = data.message || "New booking confirmed!";
      if (Notification.permission === "granted") {
        new Notification("Travel Notification", {
          body: msg,
        });
      }
    });

    return () => {
      channel.unbind_all();
      channel.unsubscribe();
    };
  }, []);

  const handleGetPrice = async () => {
    if (!destination || !flightDate) {
      alert("Please enter destination and flight date.");
      return;
    }

    try {
      const res = await axios.post("http://localhost:5005/get-price", {
        destination,
        ticketType,
        flightDate,
        flightTime,
      }, { withCredentials: true });

      setPrice(res.data.final_price);
    } catch (err) {
      console.error("❌ Failed to fetch price:", err);
      alert("Could not fetch dynamic price.");
    }
  };

  const handleBooking = async () => {
    const email = localStorage.getItem("userEmail");
    const phone = localStorage.getItem("userPhone");

    if (!email || !phone) {
      alert("Login again. Email or phone missing.");
      return;
    }

    try {
      await axios.post("http://localhost:5002/send-email", {
        email,
        destination,
        ticketType,
      }, { withCredentials: true });

      await axios.post("http://localhost:5003/send-sms", {
        phone,
        destination,
        ticketType,
      }, { withCredentials: true });

      await axios.post("http://localhost:5004/send-push", {
        message: `Book your return ticket to ${destination} now!`,
      });

      alert("✅ Booking Confirmed! Notifications sent.");
    } catch (err) {
      console.error("❌ Booking failed:", err);
      alert("Booking failed. Check console.");
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2>✈️ Book Your Trip</h2>

        <input
          type="text"
          placeholder="Enter Destination"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          style={styles.input}
        />

        <select
          value={ticketType}
          onChange={(e) => setTicketType(e.target.value)}
          style={styles.input}
        >
          <option value="economy">Economy</option>
          <option value="business">Business</option>
        </select>

        <input
          type="date"
          value={flightDate}
          onChange={(e) => setFlightDate(e.target.value)}
          style={styles.input}
        />

        <select
          value={flightTime}
          onChange={(e) => setFlightTime(e.target.value)}
          style={styles.input}
        >
          <option value="morning">Morning</option>
          <option value="afternoon">Afternoon</option>
          <option value="evening">Evening</option>
        </select>

        <button onClick={handleGetPrice} style={styles.button}>
           Get Price
        </button>

        {price !== null && (
          <h4 style={{ marginTop: "1rem" }}>💰 Final Price: ₹{price}</h4>
        )}

        <button
          onClick={handleBooking}
          disabled={price === null}
          style={{ ...styles.button, backgroundColor: "#2ecc71" }}
        >
           Confirm Booking
        </button>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#f4f6f8",
  },
  card: {
    background: "#ffffff",
    padding: "2rem",
    borderRadius: "10px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
    width: "350px",
    textAlign: "center",
  },
  input: {
    margin: "10px 0",
    padding: "10px",
    width: "100%",
    borderRadius: "5px",
    border: "1px solid #ccc",
  },
  button: {
    padding: "10px",
    width: "100%",
    border: "none",
    borderRadius: "5px",
    backgroundColor: "#3498db",
    color: "white",
    fontWeight: "bold",
    marginTop: "10px",
    cursor: "pointer",
  },
};

export default Home;
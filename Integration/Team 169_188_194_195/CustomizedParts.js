import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Pusher from "pusher-js";
import axios from 'axios';

function CustomizedParts() {
  const navigate = useNavigate();
  const [cart, setCart] = useState([]);
  const [userDob, setUserDob] = useState("");
  const [discounts, setDiscounts] = useState({ discount_percent: 0, reason: "" });
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    const savedCart = JSON.parse(localStorage.getItem('cart')) || [];
    setCart(savedCart);

    const username = localStorage.getItem("username");
    if (username) {
      fetch(`/api/user/user/${username}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.dob) setUserDob(data.dob);
          if (data.email) setUserEmail(data.email);
        })
        .catch((err) => console.error("Failed to fetch user details", err));
    }
  }, []);

  useEffect(() => {
    if (userDob) {
      fetch(`/api/discount/discount/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dob: userDob })
      })
        .then((res) => res.json())
        .then((data) => setDiscounts(data))
        .catch((err) => console.error("Failed to fetch discounts", err));
    }
  }, [userDob]);

  useEffect(() => {
    if (Notification.permission !== "granted") {
      Notification.requestPermission();
    }

    const pusher = new Pusher("b4482d597aab277ec097", {
      cluster: "ap2",
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

  const handleRemoveFromCart = (pkg) => {
    const newCart = cart.filter(item =>
      !(item._id === pkg._id &&
        JSON.stringify(item.activities) === JSON.stringify(pkg.activities) &&
        item.selectedDates === pkg.selectedDates)
    );
    setCart(newCart);
    localStorage.setItem('cart', JSON.stringify(newCart));
  };

  const handleCheckout = async () => {
    const username = localStorage.getItem("username");

    if (!username) {
      alert("You must be logged in to checkout.");
      navigate('/login');
      return;
    }

    if (!userEmail) {
      alert("Email not found, unable to proceed with checkout.");
      return;
    }

    try {
      // 🔔 Local notification
      if (Notification.permission === "granted") {
        new Notification("Travel Notification", {
          body: "Your booking has been confirmed!",
        });
      }

      // 🔁 Loop through cart and send push API request to Team 4
      for (const pkg of cart) {
        const destination = pkg.destination;

        await axios.post(`http://bore.pub:30003/send-push`, {
          message: `Book your return ticket to now!`,
        });

        console.log(`Push notification sent for ${destination}`);
      }

      alert("Checkout successful! Redirecting to packages...");
      setCart([]);
      localStorage.removeItem('cart');
      navigate('/packages');
    } catch (error) {
      console.error("Push notification error:", error);
      alert("Checkout succeeded but push notification failed.");
      setCart([]);
      localStorage.removeItem('cart');
      navigate('/packages');
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <h2 style={{
        fontSize: '1.875rem',
        fontWeight: 'bold',
        marginBottom: '1.5rem',
        color: '#2563eb'
      }}>
        Your Customized Cart
      </h2>

      {cart.length === 0 ? (
        <p style={{ color: '#6b7280' }}>No packages in the cart.</p>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '24px'
        }}>
          {cart.map((pkg, index) => {
            const actualPrice = pkg.finalPrice || pkg.price;
            const discount = discounts.discount_percent || 0;
            const discountedPrice = actualPrice * (1 - discount / 100);
            return (
              <div key={index} style={{
                backgroundColor: 'white',
                padding: '16px',
                borderRadius: '8px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                border: '1px solid #e5e7eb'
              }}>
                <h3 style={{
                  fontSize: '1.25rem',
                  fontWeight: '600',
                  color: '#3b82f6',
                  marginBottom: '0.5rem'
                }}>
                  {pkg.destination}
                </h3>
                <p><strong>Price:</strong> ${pkg.finalPrice || pkg.price}</p>
                <p><strong>Discount:</strong> {discount}%</p>
                <p><strong>Discounted Price:</strong> ${discountedPrice.toFixed(2)}</p>
                <p><strong>Duration:</strong> {pkg.duration}</p>
                <p><strong>Activities:</strong></p>
                <ul style={{ paddingLeft: '20px', marginTop: '4px', marginBottom: '8px' }}>
                  {pkg.activities?.map((act, idx) => (
                    <li key={idx}>
                      {act.name}
                    </li>
                  ))}
                </ul>
                {pkg.selectedDates && (
                  <p><strong>Selected Date:</strong> {pkg.selectedDates}</p>
                )}

                <button
                  onClick={() => handleRemoveFromCart(pkg)}
                  style={{
                    marginTop: '12px',
                    backgroundColor: '#ef4444',
                    color: 'white',
                    padding: '8px 16px',
                    borderRadius: '4px',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'background-color 0.3s ease'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#dc2626'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#ef4444'}
                >
                  Remove from Cart
                </button>
              </div>
            );
          })}
        </div>
      )}
      {cart.length > 0 && (
        <button
          onClick={handleCheckout}
          style={{
            marginTop: '24px',
            backgroundColor: '#10b981',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '4px',
            border: 'none',
            cursor: 'pointer',
            fontSize: '1.25rem',
            transition: 'background-color 0.3s ease'
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#059669'}
          onMouseLeave={(e) => e.target.style.backgroundColor = '#10b981'}
        >
          Checkout
        </button>
      )}
    </div>
  );
}

export default CustomizedParts;

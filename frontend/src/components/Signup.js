import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function Signup() {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSignup = async () => {
    try {
      await axios.post('http://localhost:5000/signup', {
        email,
        phone,
        password,
      }, { withCredentials: true });

      alert('✅ Signup successful!');
      navigate('/login');
    } catch (err) {
      alert(err.response?.data?.error || '❌ Signup failed');
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2> Signup</h2>

        <input
          placeholder="Email"
          onChange={(e) => setEmail(e.target.value)}
          style={styles.input}
        />
        <input
          placeholder="Phone (+91...)"
          onChange={(e) => setPhone(e.target.value)}
          style={styles.input}
        />
        <input
          placeholder="Password"
          type="password"
          onChange={(e) => setPassword(e.target.value)}
          style={styles.input}
        />

        <button onClick={handleSignup} style={styles.button}>
           Signup
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#f0f2f5",
  },
  card: {
    background: "#fff",
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
    backgroundColor: "#2ecc71",
    color: "white",
    fontWeight: "bold",
    marginTop: "10px",
    cursor: "pointer",
  },
};

export default Signup;
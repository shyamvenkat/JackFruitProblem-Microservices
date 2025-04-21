import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function Login() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const response = await axios.post("http://localhost:5000/login", {
        identifier,
        password
      }, { withCredentials: true });

      localStorage.setItem("userEmail", response.data.email);
      localStorage.setItem("userPhone", response.data.phone);

      alert(" Login successful!");
      navigate("/home");
    } catch (error) {
      const errorMsg = error.response?.data?.error || "Login failed due to server/network issue.";
      alert("Login failed: " + errorMsg);
    }
    
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2> Login</h2>

        <input
          type="text"
          placeholder="Email or Phone"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          style={styles.input}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={styles.input}
        />

        <button onClick={handleLogin} style={styles.button}>
           Login
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
    backgroundColor: "#3498db",
    color: "white",
    fontWeight: "bold",
    marginTop: "10px",
    cursor: "pointer",
  },
};

export default Login;
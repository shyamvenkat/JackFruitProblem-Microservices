import React, { useEffect, useState } from 'react';
import axios from 'axios';

function Inbox() {
  const [emails, setEmails] = useState([]);

  useEffect(() => {
    axios.get('http://localhost:5002/inbox', { withCredentials: true })
      .then(res => setEmails(res.data))
      .catch(() => alert("Failed to load inbox"));
  }, []);

  return (
    <div>
      <h2>Inbox</h2>
      {emails.map((mail, index) => (
        <div key={index} style={{ marginBottom: '1rem' }}>
          <strong>{mail.subject}</strong>
          <p>{mail.body}</p>
        </div>
      ))}
    </div>
  );
}

export default Inbox;
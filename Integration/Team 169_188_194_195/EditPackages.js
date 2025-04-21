import React, { useEffect, useState } from 'react';

export default function EditPackages() {
  const [packages, setPackages] = useState([]);
  const [inputs, setInputs] = useState({});
  const [activities, setActivities] = useState([
    { name: '', price: '', customizable: false }
  ]);
  const [dynamicPricing, setDynamicPricing] = useState(false); // NEW
  const API_URL = '/api/admin/packages';

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      const res = await fetch(API_URL);
      const data = await res.json();
      setPackages(data);
    } catch (err) {
      console.error("Error fetching packages:", err);
    }
  };

  const handleInputChange = (field, value) => {
    setInputs(prev => ({ ...prev, [field]: value }));
  };

  const handleActivityChange = (index, field, value) => {
    const updated = [...activities];
    updated[index][field] = field === 'customizable' ? value.target.checked : value;
    setActivities(updated);
  };

  const addActivityField = () => {
    setActivities([...activities, { name: '', price: '', customizable: false }]);
  };

  const removeActivityField = (index) => {
    const updated = activities.filter((_, i) => i !== index);
    setActivities(updated);
  };

  const handleAddPackage = async () => {
  const { destination, price, duration, tags } = inputs;
  if (!destination || (!price && !dynamicPricing) || !duration || !activities.length) {
    alert('All fields except tags are required!');
    return;
  }

  const visitors = Math.floor(Math.random() * 5) + 1;
  const bookings = Math.floor(Math.random() * 100);
  const today = new Date().toISOString().split('T')[0];

  let finalPrice = Number(price);
  let pricingError = false; // Flag to track if pricing API call failed

  const packagePayload = {
    destination,
    price: Number(price) || 1000,
    duration: `${duration} days`,
    activities: activities.map(a => ({
      name: a.name,
      price: Number(a.price),
      customizable: a.customizable
    })),
    tags: tags ? tags.split(',').map(t => t.trim()) : [],
    dynamicPricing,
    visitors,
    bookings,
    selectedDates: today
  };

  // If dynamic pricing is enabled, hit the pricing API
  if (dynamicPricing) {
    const pricingPayload = {
      packageId: Math.floor(Date.now() / 1000).toString(), // dummy ID for now
      date: packagePayload.selectedDates,
      destination: packagePayload.destination,
      visitors: packagePayload.visitors,
      bookings: packagePayload.bookings,
      price: packagePayload.price,
      duration: packagePayload.duration,
      activities: packagePayload.activities,
      tags: packagePayload.tags,
      dynamicPricing: packagePayload.dynamicPricing
    };

    try {
      const pricingRes = await fetch(`http://bore.pub:30001/package-price`, { //http://bore.pub:30001/package-price
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pricingPayload)
      });

      if (pricingRes.ok) {
        const pricingData = await pricingRes.json();
        console.log(pricingData);
        finalPrice = pricingData.final_price;
        console.log(finalPrice)
      } else {
        console.error("Pricing API failed with status:", pricingRes.status);
        pricingError = true;
        alert("Failed to fetch dynamic price. Using base price.");
      }
    } catch (err) {
      console.error("Pricing API error:", err);
      pricingError = true;
      alert("Failed to fetch dynamic price. Using base price.");
    }
  }

  // Final package with computed price
  const newPackage = {
    ...packagePayload,
    basePrice: packagePayload.price,
    computedPrice: finalPrice
  };

  console.log(newPackage.computedPrice)
  // Save package to MongoDB via your own API
  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newPackage)
    });

    if (res.ok) {
      fetchPackages();
      setInputs({});
      setActivities([{ name: '', price: '', customizable: false }]);
      setDynamicPricing(false);
      if (pricingError) {
        alert("Package added successfully, but dynamic pricing failed.");
      }
    } else {
      alert("Failed to add package.");
    }
  } catch (err) {
    console.error("Error adding package:", err);
    alert("Failed to add package.");
  }
};

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        fetchPackages();
      } else {
        alert("Failed to delete package");
      }
    } catch (err) {
      console.error("Error deleting package:", err);
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <h2 style={{
        fontSize: '1.875rem',
        fontWeight: 'bold',
        marginBottom: '1.5rem',
        textAlign: 'center'
      }}>
        Edit Packages
      </h2>

      {/* Add Package Form */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '40px',
        alignItems: 'flex-end'
      }}>
        <input
          type="text"
          placeholder="Destination"
          value={inputs.destination || ''}
          onChange={(e) => handleInputChange('destination', e.target.value)}
          style={{ border: '1px solid #d1d5db', padding: '8px', borderRadius: '4px', width: '20%' }}
        />
        <input
          type="number"
          placeholder="Price"
          value={inputs.price || ''}
          onChange={(e) => handleInputChange('price', e.target.value)}
          style={{ border: '1px solid #d1d5db', padding: '8px', borderRadius: '4px', width: '20%' }}
        />
        <input
          type="number"
          placeholder="Duration (days)"
          value={inputs.duration || ''}
          onChange={(e) => handleInputChange('duration', e.target.value)}
          style={{ border: '1px solid #d1d5db', padding: '8px', borderRadius: '4px', width: '20%' }}
        />
        <input
          type="text"
          placeholder="Tags (comma separated)"
          value={inputs.tags || ''}
          onChange={(e) => handleInputChange('tags', e.target.value)}
          style={{ border: '1px solid #d1d5db', padding: '8px', borderRadius: '4px', width: '20%' }}
        />

        <div style={{ width: '100%' }}>
          <h4 style={{ marginBottom: '8px' }}>Activities:</h4>
          {activities.map((activity, index) => (
            <div key={index} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <input
                type="text"
                placeholder="Activity name"
                value={activity.name}
                onChange={(e) => handleActivityChange(index, 'name', e.target.value)}
                style={{ flex: 1, padding: '8px' }}
              />
              <input
                type="number"
                placeholder="Price"
                value={activity.price}
                onChange={(e) => handleActivityChange(index, 'price', e.target.value)}
                style={{ width: '100px', padding: '8px' }}
              />
              <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <input
                  type="checkbox"
                  checked={activity.customizable}
                  onChange={(e) => handleActivityChange(index, 'customizable', e)}
                />
                Customizable
              </label>
              {activities.length > 1 && (
                <button onClick={() => removeActivityField(index)} style={{
                  background: 'transparent',
                  color: '#ef4444',
                  border: 'none',
                  cursor: 'pointer'
                }}>✕</button>
              )}
            </div>
          ))}
          <button onClick={addActivityField} style={{
            marginTop: '8px',
            padding: '6px 12px',
            backgroundColor: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}>+ Add Activity</button>
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
          <input
            type="checkbox"
            checked={dynamicPricing}
            onChange={(e) => setDynamicPricing(e.target.checked)}
          />
          Dynamic Pricing
        </label>

        <button
          onClick={handleAddPackage}
          style={{
            backgroundColor: '#2563eb',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '4px',
            border: 'none',
            cursor: 'pointer',
            transition: 'background-color 0.3s ease'
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#1d4ed8'}
          onMouseLeave={(e) => e.target.style.backgroundColor = '#2563eb'}
        >
          Add Package
        </button>
      </div>

      {/* Package Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{
          minWidth: '100%',
          backgroundColor: 'white',
          border: '1px solid #e5e7eb',
          textAlign: 'left',
          borderCollapse: 'collapse'
        }}>
          <thead style={{ backgroundColor: '#f3f4f6' }}>
            <tr>
              <th style={{ padding: '12px 16px', border: '1px solid #e5e7eb' }}>Destination</th>
              <th style={{ padding: '12px 16px', border: '1px solid #e5e7eb' }}>Base Price</th>
              <th style={{ padding: '12px 16px', border: '1px solid #e5e7eb' }}>Computed Price</th>
              <th style={{ padding: '12px 16px', border: '1px solid #e5e7eb' }}>Duration</th>
              <th style={{ padding: '12px 16px', border: '1px solid #e5e7eb' }}>Activities</th>
              <th style={{ padding: '12px 16px', border: '1px solid #e5e7eb' }}>Tags</th>
              <th style={{ padding: '12px 16px', border: '1px solid #e5e7eb' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {packages.length > 0 ? (
              packages.map(pkg => (
                <tr key={pkg._id}>
                  <td style={{ padding: '12px 16px', border: '1px solid #e5e7eb' }}>{pkg.destination}</td>
                  <td style={{ padding: '12px 16px', border: '1px solid #e5e7eb' }}>${pkg.basePrice || '—'}</td>
                  <td style={{ padding: '12px 16px', border: '1px solid #e5e7eb' }}>${pkg.computedPrice || pkg.basePrice || '—'}</td>
                  <td style={{ padding: '12px 16px', border: '1px solid #e5e7eb' }}>{pkg.duration}</td>
                  <td style={{ padding: '12px 16px', border: '1px solid #e5e7eb' }}>
                    {pkg.activities?.map((a) => `${a.name} ($${a.price}) ${a.customizable ? '[Customizable]' : ''}`).join(', ')}
                  </td>
                  <td style={{ padding: '12px 16px', border: '1px solid #e5e7eb' }}>
                    {pkg.tags?.length ? pkg.tags.join(', ') : '—'}
                  </td>
                  <td style={{ padding: '12px 16px', border: '1px solid #e5e7eb' }}>
                    <button
                      onClick={() => handleDelete(pkg._id)}
                      style={{
                        backgroundColor: '#ef4444',
                        color: 'white',
                        padding: '4px 12px',
                        borderRadius: '4px',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'background-color 0.3s ease'
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#dc2626'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = '#ef4444'}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" style={{
                  textAlign: 'center',
                  padding: '16px',
                  color: '#6b7280'
                }}>
                  No packages available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

'use client';

import React, { useState } from 'react';

export default function RequestServicePage() {
  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: '',
    city: '',
    service: 'Service 1',
    description: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<any>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    // Simple frontend phone validation (10 digits)
    const phoneClean = formData.phoneNumber.replace(/\D/g, '');
    if (phoneClean.length < 10) {
      setError('Please enter a valid 10-digit phone number.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          phoneNumber: phoneClean,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      setSuccess(data);
      // Reset form
      setFormData({
        name: '',
        phoneNumber: '',
        city: '',
        service: 'Service 1',
        description: '',
      });
    } catch (err: any) {
      setError(err.message || 'An error occurred while submitting.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in" style={{ maxWidth: '600px', margin: '2rem auto' }}>
      <h1 className="page-title">Submit Service Request</h1>
      <p className="page-subtitle">Get connected with 3 local service providers instantly.</p>

      <div className="glass-card">
        {error && (
          <div className="alert alert-danger" id="submit-error">
            <span>⚠️</span>
            <div>{error}</div>
          </div>
        )}

        {success && (
          <div className="alert alert-success" id="submit-success" style={{ flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>✅</span>
              <strong>Enquiry Registered Successfully!</strong>
            </div>
            <div style={{ fontSize: '0.9rem', marginTop: '0.5rem', width: '100%' }}>
              <p style={{ marginBottom: '0.5rem' }}>Lead ID: <code>{success.leadId}</code></p>
              <p style={{ fontWeight: '600', marginBottom: '0.25rem' }}>Assigned Providers:</p>
              <ul style={{ paddingLeft: '1.25rem', listStyleType: 'disc' }}>
                {success.assignedProviders.map((p: any) => (
                  <li key={p.providerId}>
                    {p.name} (Leads count: {p.leadsCount}/10)
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} id="lead-form">
          <div className="form-group">
            <label className="form-label" htmlFor="name">Full Name</label>
            <input
              type="text"
              id="name"
              name="name"
              className="form-control"
              required
              placeholder="e.g. John Doe"
              value={formData.name}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="phoneNumber">Phone Number</label>
            <input
              type="tel"
              id="phoneNumber"
              name="phoneNumber"
              className="form-control"
              required
              placeholder="e.g. 9999999999"
              value={formData.phoneNumber}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="city">City</label>
            <input
              type="text"
              id="city"
              name="city"
              className="form-control"
              required
              placeholder="e.g. New York"
              value={formData.city}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="service">Service Type</label>
            <select
              id="service"
              name="service"
              className="form-control"
              value={formData.service}
              onChange={handleChange}
            >
              <option value="Service 1">Service 1</option>
              <option value="Service 2">Service 2</option>
              <option value="Service 3">Service 3</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="description">Requirement Details</label>
            <textarea
              id="description"
              name="description"
              className="form-control"
              required
              placeholder="Describe your request..."
              value={formData.description}
              onChange={handleChange}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            id="btn-submit-lead"
          >
            {loading ? 'Processing Lead Allocation...' : 'Submit Request'}
          </button>
        </form>
      </div>
    </div>
  );
}

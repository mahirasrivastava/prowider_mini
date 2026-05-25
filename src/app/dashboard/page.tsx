'use client';

import React, { useState, useEffect } from 'react';

interface LeadInfo {
  _id: string;
  name: string;
  phoneNumber: string;
  city: string;
  service: string;
  description: string;
  createdAt: string;
}

interface ProviderInfo {
  _id: string;
  providerId: number;
  name: string;
  leadsCount: number;
  remainingQuota: number;
  lastAssignedAt: string | null;
  leads: LeadInfo[];
}

export default function DashboardPage() {
  const [providers, setProviders] = useState<ProviderInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const res = await fetch('/api/dashboard');
      if (!res.ok) {
        throw new Error('Failed to fetch dashboard data');
      }
      const data = await res.json();
      setProviders(data.providers || []);
      setLastUpdated(new Date());
      setError(null);
    } catch (err: any) {
      console.error(err);
      setError('Error refreshing dashboard data. Retrying...');
    } finally {
      setLoading(false);
    }
  };

  // Poll data
  useEffect(() => {
    fetchDashboardData();

    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchDashboardData();
    }, 2000); // refresh every 2 seconds

    return () => clearInterval(interval);
  }, [autoRefresh]);

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <h1 className="page-title" style={{ textAlign: 'left', margin: 0 }}>Provider Dashboard</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '0.25rem' }}>
            Monitor monthly lead quotas, allocations, and provider assignments.
          </p>
        </div>

        <div className="glass-card" style={{ padding: '0.75rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1.5rem', borderRadius: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: error ? 'var(--error)' : 'var(--success)',
              boxShadow: error ? '0 0 8px var(--error)' : '0 0 8px var(--success)',
              display: 'inline-block'
            }}></span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Last updated: {lastUpdated.toLocaleTimeString()}
            </span>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              style={{
                cursor: 'pointer',
                accentColor: 'var(--primary)',
                width: '15px',
                height: '15px'
              }}
            />
            Auto-Refresh (2s)
          </label>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger" style={{ marginBottom: '2rem' }}>
          <span>⚠️</span>
          <div>{error}</div>
        </div>
      )}

      {loading && providers.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-muted)' }}>
          <div className="pulse-glow" style={{ fontSize: '1.2rem', fontWeight: 600 }}>Loading dashboard state...</div>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '1.5rem'
        }}>
          {providers.map((provider) => {
            const quotaPercentage = (provider.leadsCount / 10) * 100;
            const isExhausted = provider.leadsCount >= 10;

            return (
              <div
                key={provider._id}
                className="glass-card"
                style={{
                  padding: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1.25rem',
                  borderColor: isExhausted ? 'rgba(244, 63, 94, 0.2)' : 'var(--card-border)',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {/* Visual glow on top border for full quota */}
                {isExhausted && (
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '3px',
                    background: 'linear-gradient(90deg, var(--error), #fd5c63)'
                  }}></div>
                )}

                {/* Card Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: '700' }}>{provider.name}</h3>
                    <span style={{
                      display: 'inline-block',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      padding: '0.2rem 0.5rem',
                      borderRadius: '4px',
                      marginTop: '0.25rem',
                      backgroundColor: isExhausted ? 'rgba(244, 63, 94, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                      color: isExhausted ? 'var(--error)' : 'var(--success)',
                      border: isExhausted ? '1px solid rgba(244, 63, 94, 0.2)' : '1px solid rgba(16, 185, 129, 0.2)'
                    }}>
                      {isExhausted ? 'EXHAUSTED' : 'ACTIVE'}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>QUOTA</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>
                      {provider.leadsCount}<span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 400 }}>/10</span>
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <div style={{ width: '100%', height: '6px', backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${quotaPercentage}%`,
                      height: '100%',
                      borderRadius: '3px',
                      background: isExhausted 
                        ? 'linear-gradient(90deg, #f43f5e 0%, #e11d48 100%)' 
                        : 'linear-gradient(90deg, #8b5cf6 0%, #ec4899 100%)',
                      transition: 'width 0.4s ease'
                    }}></div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <span>{provider.remainingQuota} remaining</span>
                    {provider.lastAssignedAt && (
                      <span>Last: {new Date(provider.lastAssignedAt).toLocaleTimeString()}</span>
                    )}
                  </div>
                </div>

                {/* Assigned Leads Section */}
                <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, gap: '0.5rem' }}>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', paddingBottom: '0.25rem' }}>
                    Received Leads ({provider.leads.length})
                  </h4>

                  {provider.leads.length === 0 ? (
                    <div style={{ padding: '1.5rem 0', textAlign: 'center', fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.25)', fontStyle: 'italic' }}>
                      No leads received yet
                    </div>
                  ) : (
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem',
                      maxHeight: '220px',
                      overflowY: 'auto',
                      paddingRight: '4px'
                    }}>
                      {provider.leads.map((lead) => (
                        <div
                          key={lead._id}
                          style={{
                            padding: '0.65rem 0.8rem',
                            backgroundColor: 'rgba(255, 255, 255, 0.02)',
                            borderRadius: '6px',
                            border: '1px solid rgba(255, 255, 255, 0.03)',
                            fontSize: '0.85rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.25rem'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                            <span style={{ color: '#fff' }}>{lead.name}</span>
                            <span style={{ 
                              fontSize: '0.75rem', 
                              color: lead.service === 'Service 1' ? '#a78bfa' : lead.service === 'Service 2' ? '#f472b6' : '#34d399',
                              fontWeight: '700'
                            }}>
                              {lead.service}
                            </span>
                          </div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                            📞 {lead.phoneNumber} | 📍 {lead.city}
                          </div>
                          <div style={{ 
                            fontSize: '0.8rem', 
                            color: 'rgba(255,255,255,0.6)', 
                            whiteSpace: 'nowrap', 
                            textOverflow: 'ellipsis', 
                            overflow: 'hidden',
                            marginTop: '0.2rem'
                          }}>
                            "{lead.description}"
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

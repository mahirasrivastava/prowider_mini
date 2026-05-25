'use client';

import React, { useState } from 'react';

export default function TestToolsPage() {
  const [selectedProvider, setSelectedProvider] = useState<number>(1);
  const [customPaymentId, setCustomPaymentId] = useState<string>('');
  const [concurrencyService, setConcurrencyService] = useState<string>('Service 1');
  const [logs, setLogs] = useState<{ text: string; type: 'info' | 'success' | 'error' | 'warning'; time: string }[]>([]);
  const [loading, setLoading] = useState(false);

  const addLog = (text: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') => {
    const time = new Date().toLocaleTimeString();
    setLogs((prev) => [{ text, type, time }, ...prev]);
  };

  const clearLogs = () => setLogs([]);

  // 1. Reset Database
  const handleResetSystem = async () => {
    setLoading(true);
    addLog('Initiating system reset...', 'info');
    try {
      const res = await fetch('/api/test/reset', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        addLog(data.message || 'System reset successful.', 'success');
      } else {
        addLog(data.error || 'Reset failed.', 'error');
      }
    } catch (err: any) {
      addLog(`Error resetting system: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Generate a random Payment ID
  const generateRandomPaymentId = () => {
    return 'PAY_' + Math.random().toString(36).substr(2, 9).toUpperCase();
  };

  // 2. Trigger Single Webhook
  const triggerWebhook = async (payId: string, providerId: number, isSilent = false) => {
    try {
      if (!isSilent) {
        addLog(`Triggering payment webhook: PaymentId=${payId}, ProviderId=${providerId}`, 'info');
      }
      const res = await fetch('/api/webhooks/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId: payId, providerId }),
      });
      const data = await res.json();
      if (res.ok) {
        if (data.idempotent) {
          addLog(`Webhook Response: ${data.message} (Idempotent detected)`, 'warning');
        } else {
          addLog(`Webhook Response: ${data.message}`, 'success');
        }
        return { success: true, data };
      } else {
        addLog(`Webhook Error: ${data.error || 'Failed'}`, 'error');
        return { success: false, error: data.error };
      }
    } catch (err: any) {
      addLog(`Network Error calling webhook: ${err.message}`, 'error');
      return { success: false, error: err.message };
    }
  };

  // Wrapper for Single Webhook Click
  const handleSingleWebhook = async () => {
    const payId = customPaymentId.trim() || generateRandomPaymentId();
    if (!customPaymentId) {
      setCustomPaymentId(payId);
    }
    setLoading(true);
    await triggerWebhook(payId, selectedProvider);
    setLoading(false);
  };

  // 3. Test Webhook Idempotency (Call multiple times with same ID)
  const handleIdempotencyTest = async () => {
    const payId = customPaymentId.trim() || generateRandomPaymentId();
    if (!customPaymentId) {
      setCustomPaymentId(payId);
    }
    setLoading(true);
    addLog(`Idempotency Test: Sending 3 concurrent requests with the SAME Payment ID: ${payId}`, 'info');

    // Fire 3 requests in parallel
    const promises = [
      triggerWebhook(payId, selectedProvider, true),
      triggerWebhook(payId, selectedProvider, true),
      triggerWebhook(payId, selectedProvider, true),
    ];

    const results = await Promise.all(promises);
    const successCount = results.filter((r) => r.success).length;
    addLog(`Idempotency Test complete. Received ${successCount}/3 successful responses.`, 'success');
    setLoading(false);
  };

  // 4. Generate 10 Leads Instantly (Concurrency Test)
  const handleConcurrencyTest = async () => {
    setLoading(true);
    addLog(`Concurrency Test: Generating 10 leads simultaneously for "${concurrencyService}"...`, 'info');

    // Create 10 dummy lead requests
    const leadRequests = Array.from({ length: 10 }).map((_, index) => {
      // Add randomness to phone to avoid duplicate validation triggering
      // (Unless we want to test duplicate rule, but here we want to test allocation concurrency)
      const randomPhone = '900' + String(Math.floor(1000000 + Math.random() * 9000000));
      return {
        name: `Test Customer ${index + 1}`,
        phoneNumber: randomPhone,
        city: 'Concurrent City',
        service: concurrencyService,
        description: `Simultaneous test lead number ${index + 1}`,
      };
    });

    addLog('Firing 10 API requests concurrently via Promise.all...', 'info');

    const start = Date.now();
    const promises = leadRequests.map(async (lead, idx) => {
      try {
        const res = await fetch('/api/leads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(lead),
        });
        const data = await res.json();
        if (res.ok) {
          const assignedNames = data.assignedProviders.map((p: any) => `${p.name} (${p.leadsCount}/10)`).join(', ');
          addLog(`Req #${idx + 1} Success! Assigned to: [${assignedNames}]`, 'success');
          return { success: true };
        } else {
          addLog(`Req #${idx + 1} Failed: ${data.error}`, 'error');
          return { success: false, error: data.error };
        }
      } catch (err: any) {
        addLog(`Req #${idx + 1} Network Error: ${err.message}`, 'error');
        return { success: false, error: err.message };
      }
    });

    const results = await Promise.all(promises);
    const duration = Date.now() - start;
    const successes = results.filter((r) => r.success).length;

    addLog(`Concurrency simulation completed in ${duration}ms. Success: ${successes}/10.`, 'info');
    setLoading(false);
  };

  return (
    <div className="fade-in">
      <h1 className="page-title">Testing & Diagnostics Panel</h1>
      <p className="page-subtitle">Simulate real-world payment webhooks and high-concurrency conditions.</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', alignItems: 'start', flexWrap: 'wrap' }}>
        
        {/* Actions Section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Section 1: Reset DB */}
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ marginBottom: '0.5rem', color: '#ff859b' }}>Reset System State</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
              Clear all submitted leads and reset all provider quotas back to 10 (sets lead count to 0). Useful for starting test cycles fresh.
            </p>
            <button
              onClick={handleResetSystem}
              disabled={loading}
              className="btn"
              style={{ backgroundColor: 'rgba(244, 63, 94, 0.2)', border: '1px solid rgba(244, 63, 94, 0.3)', color: '#ff859b' }}
              id="btn-reset-db"
            >
              Reset Database & Quotas
            </button>
          </div>

          {/* Section 2: Webhook Simulation */}
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ marginBottom: '0.5rem', color: '#a78bfa' }}>Webhook Simulation</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
              Simulates a payment gateway notification. Resetting a provider's quota requires a valid webhook event.
            </p>

            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label className="form-label" style={{ fontSize: '0.75rem' }}>Select Provider</label>
              <select
                className="form-control"
                style={{ padding: '0.6rem 0.8rem', fontSize: '0.85rem' }}
                value={selectedProvider}
                onChange={(e) => setSelectedProvider(Number(e.target.value))}
              >
                {Array.from({ length: 8 }).map((_, i) => (
                  <option key={i + 1} value={i + 1}>Provider {i + 1}</option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label className="form-label" style={{ fontSize: '0.75rem' }}>
                Payment Transaction ID
              </label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  className="form-control"
                  style={{ padding: '0.6rem 0.8rem', fontSize: '0.85rem' }}
                  placeholder="Leave empty to auto-generate"
                  value={customPaymentId}
                  onChange={(e) => setCustomPaymentId(e.target.value)}
                />
                <button
                  onClick={() => setCustomPaymentId(generateRandomPaymentId())}
                  className="btn"
                  style={{ width: 'auto', padding: '0 1rem', fontSize: '0.85rem', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid var(--input-border)', color: '#fff' }}
                >
                  Gen
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={handleSingleWebhook}
                disabled={loading}
                className="btn btn-primary"
                style={{ fontSize: '0.85rem', padding: '0.7rem' }}
                id="btn-trigger-webhook"
              >
                Send Webhook
              </button>
              <button
                onClick={handleIdempotencyTest}
                disabled={loading}
                className="btn"
                style={{ fontSize: '0.85rem', padding: '0.7rem', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid var(--input-border)', color: '#fff' }}
                id="btn-test-idempotency"
              >
                Test Idempotency (3x)
              </button>
            </div>
          </div>

          {/* Section 3: Concurrency Simulator */}
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ marginBottom: '0.5rem', color: '#34d399' }}>Concurrency Load Test</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
              Trigger 10 leads simultaneously to evaluate locking efficiency, rotation accuracy, and double-allocation prevention.
            </p>

            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label className="form-label" style={{ fontSize: '0.75rem' }}>Select Service for Test</label>
              <select
                className="form-control"
                style={{ padding: '0.6rem 0.8rem', fontSize: '0.85rem' }}
                value={concurrencyService}
                onChange={(e) => setConcurrencyService(e.target.value)}
              >
                <option value="Service 1">Service 1 (Pool: P2, P3, P4 | Mand: P1)</option>
                <option value="Service 2">Service 2 (Pool: P6, P7, P8 | Mand: P5)</option>
                <option value="Service 3">Service 3 (Pool: P2-P3-P5-P6-P7-P8 | Mand: P1, P4)</option>
              </select>
            </div>

            <button
              onClick={handleConcurrencyTest}
              disabled={loading}
              className="btn btn-primary"
              style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', boxShadow: '0 4px 15px rgba(16, 185, 129, 0.2)', fontSize: '0.9rem' }}
              id="btn-concurrency-test"
            >
              Generate 10 Leads Instantly
            </button>
          </div>

        </div>

        {/* Logs terminal section */}
        <div className="glass-card" style={{ padding: '1.5rem', height: '585px', display: 'flex', flexDirection: 'column', backgroundColor: '#02040a', border: '1px solid #1f293d' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #1f293d', paddingBottom: '0.5rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ color: '#34d399' }}>❯_</span> Console Output Logs
            </h3>
            <button
              onClick={clearLogs}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}
            >
              Clear Logs
            </button>
          </div>

          <div style={{ flexGrow: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column-reverse', gap: '0.5rem', fontFamily: 'monospace', fontSize: '0.8rem', paddingRight: '4px' }}>
            {logs.length === 0 ? (
              <div style={{ color: '#3f4b66', textAlign: 'center', padding: '4rem 0', fontStyle: 'italic' }}>
                Console is idle. Trigger actions to inspect execution sequence.
              </div>
            ) : (
              logs.map((log, index) => {
                let color = '#d1d5db';
                if (log.type === 'success') color = '#34d399';
                if (log.type === 'error') color = '#f43f5e';
                if (log.type === 'warning') color = '#f59e0b';
                
                return (
                  <div key={index} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: '0.25rem', lineHeight: '1.4' }}>
                    <span style={{ color: '#6b7280', marginRight: '0.5rem' }}>[{log.time}]</span>
                    <span style={{ color }}>{log.text}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

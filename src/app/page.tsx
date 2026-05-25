import Link from 'next/link';

export default function Home() {
  return (
    <div className="fade-in" style={{ textAlign: 'center', maxWidth: '800px', margin: '4rem auto' }}>
      <h1 className="page-title" style={{ fontSize: '3rem', marginBottom: '1.5rem' }}>
        Prowider Mini Lead Distribution System
      </h1>
      <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem', lineHeight: '1.6', marginBottom: '3rem' }}>
        An intelligent, concurrency-safe backend system that receives customer requests and distributes leads fairly among providers using deterministic round-robin matching and mandatory rules.
      </p>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '1.5rem',
        marginBottom: '3rem'
      }}>
        <div className="glass-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
          <div style={{ fontSize: '2.5rem' }}>📝</div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>1. Submit Enquiry</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.5' }}>
            Submit service requests via a public form. Automatically checks for duplicates at the database level.
          </p>
          <Link href="/request-service" className="btn btn-primary" style={{ marginTop: 'auto', fontSize: '0.9rem', padding: '0.6rem' }}>
            Submit Lead Form
          </Link>
        </div>

        <div className="glass-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
          <div style={{ fontSize: '2.5rem' }}>📊</div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>2. Real-Time Dashboard</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.5' }}>
            Track provider lead counts, remaining quotas, and full assignment histories in real time with auto-refresh.
          </p>
          <Link href="/dashboard" className="btn btn-primary" style={{ marginTop: 'auto', fontSize: '0.9rem', padding: '0.6rem', background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)' }}>
            Open Dashboard
          </Link>
        </div>

        <div className="glass-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
          <div style={{ fontSize: '2.5rem' }}>🛠️</div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>3. Testing Panel</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.5' }}>
            Reset system database, simulate payment webhook events, check idempotency, and run concurrent load tests.
          </p>
          <Link href="/test-tools" className="btn btn-primary" style={{ marginTop: 'auto', fontSize: '0.9rem', padding: '0.6rem', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
            Test Platform
          </Link>
        </div>
      </div>

      <div className="glass-card" style={{ padding: '1.5rem 2rem', textAlign: 'left', borderRadius: '12px' }}>
        <h4 style={{ color: '#fff', fontSize: '1rem', marginBottom: '0.75rem', fontWeight: '600' }}>⚡ Allocation Business Rules:</h4>
        <ul style={{ color: 'var(--text-muted)', fontSize: '0.85rem', paddingLeft: '1.25rem', lineHeight: '1.6', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <li><strong>Lead Requirements:</strong> Each lead is assigned to exactly 3 providers total. Monthly quota limit is 10 leads per provider.</li>
          <li><strong>Service 1:</strong> Provider 1 (Mandatory). Remaining slots chosen from [Provider 2, 3, 4] via round-robin.</li>
          <li><strong>Service 2:</strong> Provider 5 (Mandatory). Remaining slots chosen from [Provider 6, 7, 8] via round-robin.</li>
          <li><strong>Service 3:</strong> Providers 1 & 4 (Mandatory). Remaining slot chosen from [Provider 2, 3, 5, 6, 7, 8] via round-robin.</li>
          <li><strong>Idempotency:</strong> Webhooks reset provider quota by writing transaction IDs to avoid duplicate trigger effects.</li>
        </ul>
      </div>
    </div>
  );
}

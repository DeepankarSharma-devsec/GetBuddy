import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, getToken } from '../../api';
import { NavBar, Spinner, sym } from '../../components/ui';

interface User { id: number; is_host: boolean; full_name: string; host_status?: string | null; }

export default function HostDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [metrics, setMetrics] = useState({ total_earnings: 0, currency: 'INR', active_listings: 0, total_bookings: 0 });
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      if (!getToken()) { navigate('/login'); return; }
      try {
        const u = await api.get('/users/me');
        // Not yet applied → send to onboarding
        if (!u.data.is_host && !u.data.host_status) { navigate('/host/onboarding'); return; }
        setUser(u.data);
        // Only approved hosts have metrics to load
        if (u.data.is_host) {
          const m = await api.get('/host/me/metrics');
          setMetrics(m.data);
        }
      } catch (e) { console.error(e); navigate('/login'); }
    })();
  }, [navigate]);

  if (!user) return (<><NavBar /><div className="page container"><Spinner /></div></>);

  // Application submitted but not yet approved
  if (!user.is_host) {
    const rejected = user.host_status === 'REJECTED';
    return (
      <>
        <NavBar />
        <div className="page">
          <div className="container-narrow" style={{ paddingTop: 24 }}>
            <div className="card shadow" style={{ textAlign: 'center', padding: '48px 32px' }}>
              <div style={{
                width: 72, height: 72, borderRadius: '50%', margin: '0 auto 20px',
                background: rejected ? 'var(--coral-soft)' : 'var(--lime)',
                border: 'var(--border-card)', display: 'grid', placeItems: 'center',
              }}>
                <span style={{ fontSize: 30 }}>{rejected ? '×' : '⏳'}</span>
              </div>
              <div className="eyebrow">{rejected ? 'application closed' : 'application received'}</div>
              <h1 className="display-2" style={{ marginTop: 8, marginBottom: 12 }}>
                {rejected ? <>not approved <span className="text-coral">this time.</span></> : <>under <span className="text-cobalt">review.</span></>}
              </h1>
              <p className="text-muted" style={{ maxWidth: 420, margin: '0 auto 24px', lineHeight: 1.6 }}>
                {rejected
                  ? 'Your host application wasn\'t approved. You can update your details and reapply whenever you\'re ready.'
                  : 'Thanks for applying! Our team is reviewing your application — usually within a day. We\'ll email you the moment you\'re approved.'}
              </p>
              <div className="row gap-12" style={{ justifyContent: 'center', flexWrap: 'wrap' }}>
                <button className="btn btn-subtle" onClick={() => navigate('/explore')}>Back to explore</button>
                {rejected && <button className="btn btn-primary" onClick={() => navigate('/host/onboarding/apply')}>Update & reapply →</button>}
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <NavBar />
      <div className="page">
        <div className="container">
          <div className="row between" style={{ marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div className="eyebrow">host studio</div>
              <h1 className="display-2" style={{ marginTop: 6 }}>welcome back, <span className="text-coral">{user.full_name.split(' ')[0]}.</span></h1>
            </div>
            <div className="row gap-12">
              <button className="btn btn-subtle" onClick={() => navigate('/explore')}>User mode</button>
              <button className="btn btn-primary" onClick={() => navigate('/host/create')}>+ New listing</button>
            </div>
          </div>

          <div className="grid grid-3" style={{ marginBottom: 32 }}>
            <div className="metric" style={{ background: 'var(--ink)', color: 'var(--lime)', border: 'var(--border-card)' }}>
              <div className="label" style={{ color: 'rgba(214,242,107,0.7)' }}>lifetime payout</div>
              <div className="value" style={{ color: 'var(--lime)' }}>{sym(metrics.currency)}{Math.round(metrics.total_earnings).toLocaleString()}</div>
              <button className="btn btn-accent btn-sm" style={{ marginTop: 12 }} onClick={() => navigate('/host/earnings')}>View breakdown →</button>
            </div>
            <div className="metric">
              <div className="label">total bookings</div>
              <div className="value">{metrics.total_bookings}</div>
              <div className="delta">across all listings</div>
            </div>
            <div className="metric">
              <div className="label">active listings</div>
              <div className="value">{metrics.active_listings}</div>
              <button className="btn btn-subtle btn-sm" style={{ marginTop: 12 }} onClick={() => navigate('/explore')}>View public →</button>
            </div>
          </div>

          <div className="eyebrow" style={{ marginBottom: 12 }}>quick actions</div>
          <div className="grid grid-4">
            <Action label="Bookings" hint="Manage upcoming guests" onClick={() => navigate('/host/bookings')} color="#F1FBCB" />
            <Action label="Calendar" hint="See your schedule" onClick={() => navigate('/host/calendar')} color="#E4E8FF" />
            <Action label="Earnings" hint="Payouts & history" onClick={() => navigate('/host/earnings')} color="#FFE3DB" />
            <Action label="New listing" hint="Publish a session" onClick={() => navigate('/host/create')} color="#FFD84D" />
          </div>
        </div>
      </div>
    </>
  );
}

function Action({ label, hint, onClick, color }: { label: string; hint: string; onClick: () => void; color: string }) {
  return (
    <button className="card shadow card-clickable" onClick={onClick} style={{ background: color, textAlign: 'left', cursor: 'pointer' }}>
      <div className="h3" style={{ fontSize: 18 }}>{label}</div>
      <div className="text-muted" style={{ fontSize: 12, marginTop: 4 }}>{hint}</div>
    </button>
  );
}

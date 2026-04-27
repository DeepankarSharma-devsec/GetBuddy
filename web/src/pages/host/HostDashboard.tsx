import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, getToken } from '../../api';
import { NavBar, Spinner } from '../../components/ui';

interface User { id: number; is_host: boolean; full_name: string; }

export default function HostDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [metrics, setMetrics] = useState({ total_earnings: 0, active_listings: 0, total_bookings: 0 });
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      if (!getToken()) { navigate('/login'); return; }
      try {
        const [u, m] = await Promise.all([api.get('/users/me'), api.get('/host/me/metrics')]);
        if (!u.data.is_host) { navigate('/host/onboarding'); return; }
        setUser(u.data); setMetrics(m.data);
      } catch (e) { console.error(e); navigate('/login'); }
    })();
  }, [navigate]);

  if (!user) return (<><NavBar /><div className="page container"><Spinner /></div></>);

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
              <div className="value" style={{ color: 'var(--lime)' }}>₹{metrics.total_earnings.toFixed(0)}</div>
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

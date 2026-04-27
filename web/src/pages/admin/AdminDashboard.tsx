import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, getToken } from '../../api';
import { NavBar, Spinner } from '../../components/ui';

interface Metrics {
  total_users: number;
  total_hosts: number;
  total_listings: number;
  total_bookings: number;
  total_revenue: number;
}

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      if (!getToken()) { navigate('/login'); return; }
      try {
        const r = await api.get('/admin/metrics');
        setMetrics(r.data);
      } catch (e) {
        console.error(e);
        alert('Access Denied. Admins only.');
        navigate('/explore');
      }
    })();
  }, [navigate]);

  if (!metrics) return (<><NavBar /><div className="page container"><Spinner /></div></>);

  return (
    <>
      <NavBar />
      <div className="page">
        <div className="container">
          <div className="eyebrow">control room</div>
          <h1 className="display-2" style={{ marginTop: 6, marginBottom: 24 }}>platform overview</h1>

          <div className="grid grid-3" style={{ marginBottom: 32 }}>
            <div className="metric" style={{ background: 'var(--ink)', color: 'var(--lime)', border: 'var(--border-card)' }}>
              <div className="label" style={{ color: 'rgba(214,242,107,0.7)' }}>platform revenue</div>
              <div className="value" style={{ color: 'var(--lime)' }}>₹{metrics.total_revenue.toFixed(0)}</div>
              <div className="delta" style={{ color: 'rgba(214,242,107,0.6)' }}>15% commission of gross</div>
            </div>
            <div className="metric">
              <div className="label">total users</div>
              <div className="value">{metrics.total_users}</div>
              <button className="btn btn-subtle btn-sm" style={{ marginTop: 12 }} onClick={() => navigate('/admin/users')}>Manage →</button>
            </div>
            <div className="metric">
              <div className="label">total hosts</div>
              <div className="value">{metrics.total_hosts}</div>
              <button className="btn btn-subtle btn-sm" style={{ marginTop: 12 }} onClick={() => navigate('/admin/hosts')}>Manage →</button>
            </div>
          </div>

          <div className="grid grid-3" style={{ marginBottom: 32 }}>
            <div className="metric">
              <div className="label">total listings</div>
              <div className="value">{metrics.total_listings}</div>
              <button className="btn btn-subtle btn-sm" style={{ marginTop: 12 }} onClick={() => navigate('/admin/listings')}>Review →</button>
            </div>
            <div className="metric">
              <div className="label">total bookings</div>
              <div className="value">{metrics.total_bookings}</div>
              <button className="btn btn-subtle btn-sm" style={{ marginTop: 12 }} onClick={() => navigate('/admin/bookings')}>Review →</button>
            </div>
            <div className="metric">
              <div className="label">analytics</div>
              <div className="value" style={{ fontSize: 20, marginTop: 12 }}>trends & top listings</div>
              <button className="btn btn-subtle btn-sm" style={{ marginTop: 12 }} onClick={() => navigate('/admin/analytics')}>Open →</button>
            </div>
          </div>

          <div className="eyebrow" style={{ marginBottom: 12 }}>quick actions</div>
          <div className="grid grid-4">
            <Action label="Users" hint="Block / unblock members" onClick={() => navigate('/admin/users')} color="#F1FBCB" />
            <Action label="Hosts" hint="Verify creators" onClick={() => navigate('/admin/hosts')} color="#E4E8FF" />
            <Action label="Transactions" hint="Payout ledger" onClick={() => navigate('/admin/transactions')} color="#FFE3DB" />
            <Action label="Analytics" hint="Reports & trends" onClick={() => navigate('/admin/analytics')} color="#FFD84D" />
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

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, getToken } from '../../api';
import { NavBar, Spinner } from '../../components/ui';

export default function AnalyticsScreen() {
  const [analytics, setAnalytics] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      if (!getToken()) { navigate('/login'); return; }
      try { setAnalytics((await api.get('/admin/analytics')).data); }
      catch (e) { console.error(e); }
    })();
  }, [navigate]);

  if (!analytics) return (<><NavBar /><div className="page container"><Spinner /></div></>);

  const typeEntries = Object.entries(analytics.bookings_by_type || {}) as [string, number][];
  const revEntries = Object.entries(analytics.revenue_summary || {}) as [string, number][];
  const maxType = Math.max(1, ...typeEntries.map(([, v]) => v));
  const maxRev = Math.max(1, ...revEntries.map(([, v]) => v));

  return (
    <>
      <NavBar />
      <div className="page">
        <div className="container">
          <div className="row between" style={{ marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div className="eyebrow">reports & trends</div>
              <h1 className="display-2" style={{ marginTop: 6 }}>analytics</h1>
            </div>
            <button className="btn btn-subtle" onClick={() => navigate('/admin/dashboard')}>← Dashboard</button>
          </div>

          <div className="grid grid-2" style={{ marginBottom: 24, gap: 24 }}>
            <div className="card shadow">
              <div className="section-h">bookings by type</div>
              <div className="stack gap-12">
                {typeEntries.length === 0 ? <p className="text-muted">No data.</p> : typeEntries.map(([type, count]) => (
                  <div key={type}>
                    <div className="row between" style={{ marginBottom: 6 }}>
                      <span style={{ fontWeight: 500 }}>{type}</span>
                      <span className="mono">{count}</span>
                    </div>
                    <div style={{ height: 10, background: 'var(--cream-2)', borderRadius: 999, overflow: 'hidden', border: '1px solid var(--ink)' }}>
                      <div style={{ width: `${(count / maxType) * 100}%`, height: '100%', background: 'var(--cobalt)' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card shadow">
              <div className="section-h">revenue trends</div>
              <div className="stack gap-12">
                {revEntries.length === 0 ? <p className="text-muted">No data.</p> : revEntries.map(([month, rev]) => (
                  <div key={month}>
                    <div className="row between" style={{ marginBottom: 6 }}>
                      <span style={{ fontWeight: 500 }}>{month}</span>
                      <span className="mono" style={{ color: 'var(--cobalt)', fontWeight: 600 }}>₹{rev.toFixed(0)}</span>
                    </div>
                    <div style={{ height: 10, background: 'var(--cream-2)', borderRadius: 999, overflow: 'hidden', border: '1px solid var(--ink)' }}>
                      <div style={{ width: `${(rev / maxRev) * 100}%`, height: '100%', background: 'var(--lime)' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-2" style={{ gap: 24 }}>
            <div className="card shadow">
              <div className="section-h">top listings</div>
              <div className="stack gap-12">
                {(analytics.top_listings || []).map((l: any, i: number) => (
                  <div key={i} className="row between" style={{ alignItems: 'center', padding: '8px 0', borderBottom: i < (analytics.top_listings.length - 1) ? '1px dashed var(--ink-3)' : 'none' }}>
                    <div className="row gap-12" style={{ alignItems: 'center' }}>
                      <span className="mono" style={{ background: 'var(--lime)', border: 'var(--border-card)', borderRadius: 999, width: 28, height: 28, display: 'grid', placeItems: 'center', fontSize: 12 }}>{i + 1}</span>
                      <span style={{ fontWeight: 500 }}>{l.title}</span>
                    </div>
                    <span className="mono text-muted">{l.bookings} bookings</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card shadow" style={{ background: 'var(--ink)', color: 'var(--lime)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div className="eyebrow" style={{ color: 'rgba(214,242,107,0.7)' }}>highly active hosts</div>
              <div className="display-1" style={{ fontSize: 88, color: 'var(--lime)', marginTop: 4 }}>{analytics.active_hosts}</div>
              <p style={{ color: 'rgba(214,242,107,0.7)', fontSize: 12, marginTop: 8 }}>
                Hosts with bookings in the last 30 days.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

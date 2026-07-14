import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, getToken } from '../../api';
import { NavBar, StatusPill, Spinner, Empty, sym } from '../../components/ui';

interface Host {
  id: number;
  user_id: number;
  name: string;
  email: string;
  phone_number: string;
  status: string;
  bio?: string;
  category?: string;
  city?: string;
  country?: string;
  currency?: string;
  total_earnings: number;
}

export default function HostManagement() {
  const [hosts, setHosts] = useState<Host[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const navigate = useNavigate();

  const load = async () => {
    try { setHosts((await api.get('/admin/hosts')).data); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (!getToken()) { navigate('/login'); return; }
    load();
  }, [navigate]);

  const decide = async (id: number, action: 'approve' | 'reject') => {
    setBusyId(id);
    try {
      await api.post(`/admin/hosts/${id}/${action}`);
      await load();
    } catch (e) { console.error(e); }
    finally { setBusyId(null); }
  };

  const pending = hosts.filter(h => h.status === 'PENDING');
  const decided = hosts.filter(h => h.status !== 'PENDING');

  return (
    <>
      <NavBar />
      <div className="page">
        <div className="container">
          <div className="row between" style={{ marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div className="eyebrow">creators directory</div>
              <h1 className="display-2" style={{ marginTop: 6 }}>host management</h1>
            </div>
            <button className="btn btn-subtle" onClick={() => navigate('/admin/dashboard')}>← Dashboard</button>
          </div>

          {loading ? <Spinner /> : hosts.length === 0 ? (
            <Empty title="No hosts yet" hint="Once members apply to host, they'll appear here for review." />
          ) : (
            <>
              {/* PENDING REVIEW */}
              <div className="row gap-8" style={{ marginBottom: 12, alignItems: 'center' }}>
                <div className="section-h" style={{ margin: 0 }}>pending review</div>
                {pending.length > 0 && <span className="pill pill-yellow">{pending.length} waiting</span>}
              </div>
              {pending.length === 0 ? (
                <div className="card-soft" style={{ marginBottom: 32, color: 'var(--muted)', fontSize: 14 }}>
                  Nothing to review right now. New applications land here.
                </div>
              ) : (
                <div className="stack gap-12" style={{ marginBottom: 32 }}>
                  {pending.map(h => (
                    <div key={h.id} className="card shadow" style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ minWidth: 220, flex: 1 }}>
                        <div className="row gap-8" style={{ marginBottom: 4, flexWrap: 'wrap' }}>
                          <strong>{h.name}</strong>
                          {h.category && <span className="pill pill-soft">{h.category}</span>}
                        </div>
                        <div className="text-muted" style={{ fontSize: 13 }}>{h.email} · {h.phone_number} · {h.city || 'no city'}</div>
                        {h.bio && <p className="text-muted" style={{ fontSize: 13, marginTop: 8, maxWidth: 520, lineHeight: 1.5 }}>{h.bio}</p>}
                      </div>
                      <div className="row gap-8">
                        <button className="btn btn-subtle btn-sm" style={{ color: 'var(--coral)', borderColor: 'var(--coral-soft)' }}
                          disabled={busyId === h.id} onClick={() => decide(h.id, 'reject')}>
                          {busyId === h.id ? '…' : 'Reject'}
                        </button>
                        <button className="btn btn-primary btn-sm"
                          disabled={busyId === h.id} onClick={() => decide(h.id, 'approve')}>
                          {busyId === h.id ? '…' : 'Approve →'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* DECIDED */}
              <div className="section-h">all hosts</div>
              <div className="card shadow" style={{ padding: 0, overflow: 'hidden' }}>
                <table className="gbg-table">
                  <thead>
                    <tr>
                      <th>Host</th>
                      <th>Contact</th>
                      <th>Category</th>
                      <th>Status</th>
                      <th>Earnings</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {decided.map(h => (
                      <tr key={h.id}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{h.name}</div>
                          <div className="mono text-muted" style={{ fontSize: 11 }}>{h.email}</div>
                        </td>
                        <td className="mono text-muted">{h.phone_number}</td>
                        <td><span className="pill pill-soft">{h.category || '—'}</span></td>
                        <td><StatusPill status={h.status === 'APPROVED' ? 'VERIFIED' : h.status} /></td>
                        <td style={{ fontWeight: 600 }}>{sym(h.currency)}{Math.round(h.total_earnings).toLocaleString()}</td>
                        <td style={{ textAlign: 'right' }}>
                          {h.status === 'APPROVED' ? (
                            <button className="btn btn-subtle btn-sm" disabled={busyId === h.id} onClick={() => decide(h.id, 'reject')}>Suspend</button>
                          ) : (
                            <button className="btn btn-primary btn-sm" disabled={busyId === h.id} onClick={() => decide(h.id, 'approve')}>Approve</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

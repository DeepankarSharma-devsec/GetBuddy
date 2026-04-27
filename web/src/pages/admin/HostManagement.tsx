import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, getToken } from '../../api';
import { NavBar, StatusPill, Spinner, Empty } from '../../components/ui';

interface Host {
  id: number;
  user_id: number;
  phone_number: string;
  phone_verified: boolean;
  category: string;
  total_earnings: number;
}

export default function HostManagement() {
  const [hosts, setHosts] = useState<Host[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      if (!getToken()) { navigate('/login'); return; }
      try { setHosts((await api.get('/admin/hosts')).data); }
      catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, [navigate]);

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
            <Empty title="No hosts yet" hint="Once members verify as hosts, they'll appear here." />
          ) : (
            <div className="card shadow" style={{ padding: 0, overflow: 'hidden' }}>
              <table className="gbg-table">
                <thead>
                  <tr>
                    <th>Host</th>
                    <th>Phone</th>
                    <th>Category</th>
                    <th>Verified</th>
                    <th>Earnings</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {hosts.map(h => (
                    <tr key={h.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>Host #{h.id}</div>
                        <div className="mono text-muted" style={{ fontSize: 11 }}>user #{h.user_id}</div>
                      </td>
                      <td className="mono text-muted">{h.phone_number}</td>
                      <td>
                        <span className="pill pill-soft">{h.category || '—'}</span>
                      </td>
                      <td><StatusPill status={h.phone_verified ? 'VERIFIED' : 'PENDING'} /></td>
                      <td style={{ fontWeight: 600 }}>₹{h.total_earnings.toFixed(0)}</td>
                      <td style={{ textAlign: 'right' }}>
                        <button className="btn btn-subtle btn-sm">Suspend</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

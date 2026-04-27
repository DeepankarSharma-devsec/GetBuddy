import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, getToken } from '../../api';
import { NavBar, StatusPill, Spinner, Empty } from '../../components/ui';

interface Listing {
  id: number;
  title: string;
  price: number;
  event_type: string;
  mode: string;
  host_id: number;
  status: string;
}

export default function ListingsManagement() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      if (!getToken()) { navigate('/login'); return; }
      try { setListings((await api.get('/admin/listings')).data); }
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
              <div className="eyebrow">marketplace · live</div>
              <h1 className="display-2" style={{ marginTop: 6 }}>listings management</h1>
            </div>
            <button className="btn btn-subtle" onClick={() => navigate('/admin/dashboard')}>← Dashboard</button>
          </div>

          {loading ? <Spinner /> : listings.length === 0 ? (
            <Empty title="No listings yet" hint="Hosts haven't published anything yet." />
          ) : (
            <div className="card shadow" style={{ padding: 0, overflow: 'hidden' }}>
              <table className="gbg-table">
                <thead>
                  <tr>
                    <th>Listing</th>
                    <th>Host</th>
                    <th>Type</th>
                    <th>Mode</th>
                    <th>Price</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {listings.map(l => (
                    <tr key={l.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{l.title}</div>
                        <div className="mono text-muted" style={{ fontSize: 11 }}>#{l.id}</div>
                      </td>
                      <td className="text-muted">Host #{l.host_id}</td>
                      <td><span className="pill pill-soft">{l.event_type}</span></td>
                      <td className="mono" style={{ fontSize: 11 }}>{l.mode.toUpperCase()}</td>
                      <td style={{ fontWeight: 600 }}>₹{l.price.toFixed(0)}</td>
                      <td><StatusPill status={l.status} /></td>
                      <td style={{ textAlign: 'right' }}>
                        <button className="btn btn-subtle btn-sm">Remove</button>
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

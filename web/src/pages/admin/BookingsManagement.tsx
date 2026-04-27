import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, getToken } from '../../api';
import { NavBar, StatusPill, Spinner, Empty } from '../../components/ui';

interface Booking {
  id: number;
  user_id: number;
  event_id: number;
  status: string;
  payment_status: string;
  created_at: string;
}

export default function BookingsManagement() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      if (!getToken()) { navigate('/login'); return; }
      try { setBookings((await api.get('/admin/bookings')).data); }
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
              <div className="eyebrow">order ledger</div>
              <h1 className="display-2" style={{ marginTop: 6 }}>bookings management</h1>
            </div>
            <button className="btn btn-subtle" onClick={() => navigate('/admin/dashboard')}>← Dashboard</button>
          </div>

          {loading ? <Spinner /> : bookings.length === 0 ? (
            <Empty title="No bookings yet" hint="Bookings will populate here as guests confirm." />
          ) : (
            <div className="card shadow" style={{ padding: 0, overflow: 'hidden' }}>
              <table className="gbg-table">
                <thead>
                  <tr>
                    <th>Booking</th>
                    <th>Guest</th>
                    <th>Event</th>
                    <th>Status</th>
                    <th>Payment</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map(b => (
                    <tr key={b.id}>
                      <td><div style={{ fontWeight: 600 }}>#{b.id}</div></td>
                      <td className="text-muted">User #{b.user_id}</td>
                      <td className="text-muted">Event #{b.event_id}</td>
                      <td><StatusPill status={b.status} /></td>
                      <td><StatusPill status={b.payment_status} /></td>
                      <td className="mono text-muted" style={{ fontSize: 11 }}>
                        {new Date(b.created_at).toLocaleDateString()}
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

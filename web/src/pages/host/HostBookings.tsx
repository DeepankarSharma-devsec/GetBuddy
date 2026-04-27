import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, getToken } from '../../api';
import { NavBar, Avatar, StatusPill, Spinner, Empty, colorForId } from '../../components/ui';

interface Booking { id: number; event_title: string; start_time: string; guest_name: string; guest_email: string; status: string; created_at: string; }

export default function HostBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      if (!getToken()) { navigate('/login'); return; }
      try { setBookings((await api.get('/host/me/bookings')).data); }
      catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, [navigate]);

  return (
    <>
      <NavBar />
      <div className="page">
        <div className="container" style={{ maxWidth: 1000 }}>
          <div className="row between" style={{ marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div className="eyebrow">guests · upcoming & past</div>
              <h1 className="display-2" style={{ marginTop: 6 }}>booking management</h1>
            </div>
          </div>

          {loading ? <Spinner /> : bookings.length === 0 ? (
            <Empty title="No bookings yet" hint="Once people book your listings, they'll appear here." />
          ) : (
            <div className="stack gap-12">
              {bookings.map(b => (
                <div key={b.id} className="card shadow" style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto auto', gap: 18, alignItems: 'center' }}>
                  <Avatar name={b.guest_name} color={colorForId(b.id)} size={48} />
                  <div>
                    <h3 className="h3" style={{ fontSize: 17, marginBottom: 4 }}>{b.event_title}</h3>
                    <div className="text-muted" style={{ fontSize: 12 }}>
                      <strong style={{ color: 'var(--ink)' }}>{b.guest_name}</strong> · {b.guest_email}
                    </div>
                    <div className="text-muted mono" style={{ fontSize: 11, marginTop: 4 }}>
                      starts {new Date(b.start_time).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <StatusPill status={b.status} />
                  <div className="text-muted mono" style={{ fontSize: 10 }}>
                    confirmed<br />{new Date(b.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, getToken } from '../api';
import { NavBar, Photo, StatusPill, Spinner, Empty, colorForId, CATEGORY_COLORS } from '../components/ui';

interface Booking {
  id: number; event_id: number; status: string; payment_status: string; created_at: string;
  event_title?: string; category?: string; event_type?: string;
}

export default function MyBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      if (!getToken()) { navigate('/login'); return; }
      try {
        const [b, ev] = await Promise.all([api.get('/users/me/bookings'), api.get('/events')]);
        const enhanced = b.data.map((bk: Booking) => {
          const m = ev.data.find((e: any) => e.id === bk.event_id);
          return {
            ...bk,
            event_title: m ? m.title : `Event #${bk.event_id}`,
            category: m?.category, event_type: m?.event_type,
          };
        });
        setBookings(enhanced);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, [navigate]);

  return (
    <>
      <NavBar />
      <div className="page">
        <div className="container" style={{ maxWidth: 960 }}>
          <div className="row between" style={{ marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div className="eyebrow">your seats</div>
              <h1 className="display-2" style={{ marginTop: 6 }}>my bookings</h1>
            </div>
            <button className="btn btn-primary" onClick={() => navigate('/explore')}>+ Book another</button>
          </div>

          {loading ? <Spinner /> : bookings.length === 0 ? (
            <Empty title="No bookings yet" hint="Find a buddy, book a seat, show up. Easy."
              action={<button className="btn btn-primary" onClick={() => navigate('/explore')}>Discover experiences →</button>} />
          ) : (
            <div className="stack gap-16">
              {bookings.map(b => (
                <div key={b.id} className="card shadow card-clickable" onClick={() => navigate(`/my-bookings/${b.id}`)}
                  style={{ display: 'grid', gridTemplateColumns: '160px 1fr auto', gap: 18, alignItems: 'center', padding: 0, overflow: 'hidden' }}>
                  <div style={{ height: 120 }}>
                    <Photo label={b.category || b.event_type} color={CATEGORY_COLORS[b.category || ''] || colorForId(b.event_id)} height={120} radius={0} />
                  </div>
                  <div style={{ padding: '14px 0' }}>
                    <h3 className="h3" style={{ marginBottom: 6 }}>{b.event_title}</h3>
                    <div className="text-muted mono" style={{ fontSize: 11 }}>booked {new Date(b.created_at).toLocaleDateString()}</div>
                    <div className="row gap-8" style={{ marginTop: 8 }}>
                      <StatusPill status={b.status} />
                      {b.payment_status && <StatusPill status={b.payment_status} />}
                    </div>
                  </div>
                  <div style={{ paddingRight: 18 }}>
                    <span className="btn btn-ghost btn-sm">Details →</span>
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

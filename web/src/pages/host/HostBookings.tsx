import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, getToken } from '../../api';
import { NavBar, Avatar, StatusPill, Spinner, Empty, colorForId, durationLabel, sym } from '../../components/ui';

interface Booking {
  id: number; listing_kind: string; event_title: string;
  start_time: string | null; duration_minutes: number | null; price: number; currency?: string;
  guest_name: string; guest_email: string; guest_city?: string | null; guest_photo?: string | null;
  status: string; created_at: string;
}

export default function HostBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const navigate = useNavigate();

  const load = async () => {
    try { setBookings((await api.get('/host/me/bookings')).data); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (!getToken()) { navigate('/login'); return; }
    load();
  }, [navigate]);

  const decide = async (id: number, action: 'accept' | 'decline') => {
    setBusyId(id);
    try {
      await api.post(`/host/me/bookings/${id}/${action}`);
      await load();
    } catch (e) { console.error(e); }
    finally { setBusyId(null); }
  };

  const requests = bookings.filter(b => b.status === 'REQUESTED');
  const rest = bookings.filter(b => b.status !== 'REQUESTED');

  const slotLine = (b: Booking) =>
    b.start_time
      ? `${new Date(b.start_time).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}${b.duration_minutes ? ` · ${durationLabel(b.duration_minutes)}` : ''}`
      : 'time TBD';

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

          {loading ? <Spinner /> : (
            <>
              {/* BUDDY REQUESTS */}
              <div className="row gap-8" style={{ marginBottom: 12, alignItems: 'center' }}>
                <div className="section-h" style={{ margin: 0 }}>buddy requests</div>
                {requests.length > 0 && <span className="pill pill-yellow">{requests.length} waiting</span>}
              </div>
              {requests.length === 0 ? (
                <div className="card-soft" style={{ marginBottom: 32, color: 'var(--muted)', fontSize: 14 }}>
                  No pending requests. When a guest requests your hours, accept or decline it here.
                </div>
              ) : (
                <div className="stack gap-12" style={{ marginBottom: 32 }}>
                  {requests.map(b => (
                    <div key={b.id} className="card shadow" style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center', justifyContent: 'space-between' }}>
                      <div className="row gap-16" style={{ minWidth: 260, flex: 1 }}>
                        <Avatar name={b.guest_name} color={colorForId(b.id)} size={48} src={b.guest_photo} />
                        <div>
                          <h3 className="h3" style={{ fontSize: 17, marginBottom: 4 }}>{b.event_title}</h3>
                          <div className="text-muted" style={{ fontSize: 12 }}>
                            <strong style={{ color: 'var(--ink)' }}>{b.guest_name}</strong> · {b.guest_email}{b.guest_city ? ` · ${b.guest_city}` : ''}
                          </div>
                          <div className="text-muted mono" style={{ fontSize: 11, marginTop: 4 }}>
                            wants {slotLine(b)}
                            {b.duration_minutes ? ` · you'd earn ${sym(b.currency)}${Math.round(b.price * b.duration_minutes / 60 * 0.85).toLocaleString()}` : ''}
                          </div>
                        </div>
                      </div>
                      <div className="row gap-8">
                        <button className="btn btn-subtle btn-sm" style={{ color: 'var(--coral)', borderColor: 'var(--coral-soft)' }}
                          disabled={busyId === b.id} onClick={() => decide(b.id, 'decline')}>
                          {busyId === b.id ? '…' : 'Decline'}
                        </button>
                        <button className="btn btn-primary btn-sm" disabled={busyId === b.id} onClick={() => decide(b.id, 'accept')}>
                          {busyId === b.id ? '…' : 'Accept →'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* CONFIRMED & PAST */}
              <div className="section-h">all bookings</div>
              {rest.length === 0 ? (
                <Empty title="No bookings yet" hint="Once people book your listings, they'll appear here." />
              ) : (
                <div className="stack gap-12">
                  {rest.map(b => (
                    <div key={b.id} className="card shadow" style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto auto', gap: 18, alignItems: 'center' }}>
                      <Avatar name={b.guest_name} color={colorForId(b.id)} size={48} src={b.guest_photo} />
                      <div>
                        <h3 className="h3" style={{ fontSize: 17, marginBottom: 4 }}>{b.event_title}</h3>
                        <div className="text-muted" style={{ fontSize: 12 }}>
                          <strong style={{ color: 'var(--ink)' }}>{b.guest_name}</strong> · {b.guest_email}
                        </div>
                        <div className="text-muted mono" style={{ fontSize: 11, marginTop: 4 }}>
                          {slotLine(b)}
                        </div>
                      </div>
                      <StatusPill status={b.status} />
                      <div className="text-muted mono" style={{ fontSize: 10 }}>
                        booked<br />{new Date(b.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

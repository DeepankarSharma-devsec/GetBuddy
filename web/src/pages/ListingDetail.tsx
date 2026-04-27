import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, getToken } from '../api';
import { NavBar, Photo, Avatar, Stars, Spinner, colorForId, CATEGORY_COLORS } from '../components/ui';

interface Event {
  id: number;
  title: string;
  description: string;
  price: number;
  event_type: string;
  mode: string;
  host_id: number;
  start_time?: string;
  category?: string;
  location_details?: string;
}

export default function ListingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [existingBookingId, setExistingBookingId] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const response = await api.get('/events');
        const found = response.data.find((e: Event) => e.id.toString() === id);
        if (found) setEvent(found);
        if (getToken() && found) {
          try {
            const r = await api.get('/users/me/bookings');
            const existing = r.data.find((b: any) => b.event_id === found.id);
            if (existing) setExistingBookingId(existing.id);
          } catch {}
        }
      } catch (err) { console.error(err); }
    })();
  }, [id]);

  if (!event) return (<><NavBar /><div className="page container"><Spinner /></div></>);

  return (
    <>
      <NavBar />
      <div className="page">
        <div className="container" style={{ maxWidth: 960 }}>
          <button className="btn btn-subtle btn-sm" style={{ marginBottom: 20 }} onClick={() => navigate(-1)}>← Back</button>

          <div style={{ borderRadius: 'var(--r-lg)', overflow: 'hidden', border: 'var(--border-card)', marginBottom: 28 }}>
            <Photo label={event.category || event.event_type} color={CATEGORY_COLORS[event.category || ''] || colorForId(event.id)} height={360} radius={0} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 32 }}>
            <div>
              <div className="row gap-8" style={{ marginBottom: 14, flexWrap: 'wrap' }}>
                {event.category && <span className="pill">{event.category}</span>}
                <span className="pill pill-cobalt">{event.event_type}</span>
                <span className="pill pill-mint">{event.mode}</span>
              </div>
              <h1 className="display-2" style={{ marginBottom: 12 }}>{event.title}</h1>
              <div className="row gap-12" style={{ marginBottom: 28 }}>
                <Avatar name={`H${event.host_id}`} color={colorForId(event.host_id)} size={44} />
                <div>
                  <div style={{ fontWeight: 600 }}>Host #{event.host_id}</div>
                  <div className="row gap-6" style={{ fontSize: 12 }}>
                    <Stars value={4.9} /> <span className="text-muted">4.9 · usually replies in ~30 min</span>
                  </div>
                </div>
              </div>

              <div className="card-soft" style={{ marginBottom: 16 }}>
                <div className="section-h">about this experience</div>
                <p style={{ lineHeight: 1.7, fontSize: 15 }}>{event.description}</p>
              </div>

              <div className="card-soft">
                <div className="section-h">what's included</div>
                <ul className="stack gap-8" style={{ listStyle: 'none', padding: 0, fontSize: 14 }}>
                  <li>· Small group, intentional vibe</li>
                  <li>· Hosted by a verified human (ID + phone)</li>
                  <li>· Free cancellation up to 24h before</li>
                  <li className="text-muted" style={{ fontStyle: 'italic' }}>
                    {event.mode === 'Online' ? 'Join link shared after booking' : 'Full address shared after booking'}
                  </li>
                </ul>
              </div>
            </div>

            <aside className="card shadow" style={{ height: 'fit-content', position: 'sticky', top: 80 }}>
              <div className="eyebrow">price per seat</div>
              <div className="display-2" style={{ fontSize: 44, marginTop: 4 }}>₹{event.price.toFixed(0)}</div>
              {event.start_time && (
                <div className="mono text-muted" style={{ fontSize: 12, marginTop: 8 }}>
                  {new Date(event.start_time).toLocaleString([], { weekday: 'long', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </div>
              )}
              <div style={{ height: 18 }} />
              {existingBookingId ? (
                <button className="btn btn-subtle btn-lg" style={{ width: '100%' }} onClick={() => navigate(`/my-bookings/${existingBookingId}`)}>
                  See my booking →
                </button>
              ) : (
                <button className="btn btn-primary btn-lg" style={{ width: '100%' }} onClick={() => navigate(`/book/${event.id}`)}>
                  Book now →
                </button>
              )}
              <p className="text-muted" style={{ fontSize: 11, marginTop: 12, textAlign: 'center' }}>
                You won't be charged yet · 18+ only · UPI · cards
              </p>
            </aside>
          </div>
        </div>
      </div>
    </>
  );
}

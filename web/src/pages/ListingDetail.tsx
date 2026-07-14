import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, getToken } from '../api';
import { NavBar, Photo, Avatar, Spinner, colorForId, CATEGORY_COLORS, durationLabel, totalPrice, sym } from '../components/ui';

interface Event {
  id: number;
  listing_kind: string;
  title: string;
  description: string;
  price: number;
  currency?: string;
  event_type: string;
  mode: string;
  host_id: number;
  start_time?: string | null;
  category?: string;
  city?: string;
  duration_minutes?: number;
  max_participants?: number;
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
            // Ignore declined/cancelled so the guest can request again
            const existing = r.data.find((b: any) => b.event_id === found.id && !['DECLINED', 'CANCELLED'].includes(b.status));
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

          <div className="split-2">
            <div>
              <div className="row gap-8" style={{ marginBottom: 14, flexWrap: 'wrap' }}>
                {event.listing_kind === 'SERVICE' && <span className="pill pill-cobalt">buddy service</span>}
                {event.category && <span className="pill">{event.category}</span>}
                {event.listing_kind !== 'SERVICE' && <span className="pill pill-cobalt">{event.event_type}</span>}
                <span className="pill pill-mint">{event.mode}</span>
                {event.city && <span className="pill">{event.city}</span>}
              </div>
              <h1 className="display-2" style={{ marginBottom: 12 }}>{event.title}</h1>
              <div className="row gap-12" style={{ marginBottom: 28 }}>
                <Avatar name={`H${event.host_id}`} color={colorForId(event.host_id)} size={44} />
                <div>
                  <div style={{ fontWeight: 600 }}>Host #{event.host_id}</div>
                  <div className="row gap-6" style={{ fontSize: 12 }}>
                    <span className="pill pill-mint">phone verified</span>
                  </div>
                </div>
              </div>

              <div className="card-soft" style={{ marginBottom: 16 }}>
                <div className="section-h">about this experience</div>
                <p style={{ lineHeight: 1.7, fontSize: 15 }}>{event.description}</p>
              </div>

              <div className="card-soft">
                <div className="section-h">{event.listing_kind === 'SERVICE' ? 'how it works' : "what's included"}</div>
                <ul className="stack gap-8" style={{ listStyle: 'none', padding: 0, fontSize: 14 }}>
                  {event.listing_kind === 'SERVICE' ? (
                    <>
                      <li>· Pick your date, time, and number of hours</li>
                      <li>· Your buddy accepts (usually within a few hours)</li>
                      <li>· Admin-reviewed, verified human</li>
                      <li className="text-muted" style={{ fontStyle: 'italic' }}>
                        {event.mode === 'Online' ? 'Join link shared once your request is accepted' : 'Meeting point shared once your request is accepted'}
                      </li>
                    </>
                  ) : (
                    <>
                      <li>· Small group, intentional vibe</li>
                      <li>· Hosted by a verified human (ID + phone)</li>
                      <li>· Free cancellation up to 24h before</li>
                      <li className="text-muted" style={{ fontStyle: 'italic' }}>
                        {event.mode === 'Online' ? 'Join link shared after booking' : 'Full address shared after booking'}
                      </li>
                    </>
                  )}
                </ul>
              </div>
            </div>

            <aside className="card shadow" style={{ height: 'fit-content', position: 'sticky', top: 80 }}>
              {event.listing_kind === 'SERVICE' ? (
                <>
                  <div className="eyebrow">hourly rate · you pick the hours</div>
                  <div className="display-2" style={{ fontSize: 44, marginTop: 4 }}>{sym(event.currency)}{Math.round(event.price).toLocaleString()}<span style={{ fontSize: 18 }}>/hr</span></div>
                  <div className="text-muted" style={{ fontSize: 13, marginTop: 6 }}>
                    Choose your date, time & hours at the next step
                  </div>
                </>
              ) : (
                <>
                  <div className="eyebrow">total per seat · {durationLabel(event.duration_minutes)}</div>
                  <div className="display-2" style={{ fontSize: 44, marginTop: 4 }}>{sym(event.currency)}{totalPrice(event.price, event.duration_minutes).toLocaleString()}</div>
                  <div className="text-muted" style={{ fontSize: 13, marginTop: 6 }}>
                    {sym(event.currency)}{Math.round(event.price).toLocaleString()}/hr × {durationLabel(event.duration_minutes)}
                  </div>
                </>
              )}
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
                  {event.listing_kind === 'SERVICE' ? 'Request to book →' : 'Book now →'}
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

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, getToken, apiError } from '../api';
import { NavBar, Photo, Spinner, colorForId, CATEGORY_COLORS, sym } from '../components/ui';

interface Event { id: number; listing_kind: string; title: string; price: number; currency?: string; event_type: string; mode: string; start_time?: string | null; category?: string; city?: string; duration_minutes?: number; }

export default function BookingScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [event, setEvent] = useState<Event | null>(null);
  // Service bookings: guest picks the slot
  const [slotDate, setSlotDate] = useState('');
  const [slotHours, setSlotHours] = useState('60');

  useEffect(() => {
    (async () => {
      try {
        const r = await api.get('/events');
        const found = r.data.find((e: Event) => e.id.toString() === id);
        if (found) setEvent(found);
      } catch {}
    })();
  }, [id]);

  const isService = event?.listing_kind === 'SERVICE';

  const handlePayment = async () => {
    setErr(null);
    setLoading(true);
    try {
      if (!getToken()) { navigate('/login'); return; }
      const payload: Record<string, unknown> = { event_id: parseInt(id || '0') };
      if (isService) {
        if (!slotDate) { setErr('Pick a date and time first.'); setLoading(false); return; }
        payload.start_time = slotDate;
        payload.duration_minutes = parseInt(slotHours);
      }
      const r = await api.post('/bookings', payload);
      if (r.data?.checkout_url) {
        // Stripe-hosted payment page takes it from here
        window.location.href = r.data.checkout_url;
        return;
      }
      navigate(`/booking-success/${id}${isService ? '?requested=1' : ''}`);
    } catch (e: any) {
      setErr(apiError(e, 'Payment failed. Are you logged in?'));
    } finally { setLoading(false); }
  };

  // Per-hour pricing: total = hourly rate x session duration, rounded to whole
  // rupees so the displayed/charged amount matches the backend transaction.
  // For services the guest chooses the duration.
  const minutes = isService ? parseInt(slotHours) : (event?.duration_minutes || 60);
  const hours = minutes / 60;
  const total = event ? Math.round(event.price * hours) : 0;

  return (
    <>
      <NavBar />
      <div className="page">
        <div className="container" style={{ maxWidth: 920 }}>
          <button className="btn btn-subtle btn-sm" style={{ marginBottom: 16 }} onClick={() => navigate(-1)}>← Back</button>
          <div className="eyebrow">step 2 of 2 · checkout</div>
          <h1 className="display-2" style={{ marginTop: 6, marginBottom: 28 }}>
            {isService ? <>pick a slot & <span className="text-cobalt">request.</span></> : <>confirm & <span className="text-cobalt">pay.</span></>}
          </h1>

          {!event ? <Spinner /> : (
            <div className="split-2" style={{ gap: 24 }}>
              <div className="stack gap-16">
                {isService && (
                  <div className="card shadow">
                    <div className="section-h">pick your slot</div>
                    <div className="input-row">
                      <div className="field">
                        <label>Date & start time</label>
                        <input type="datetime-local" value={slotDate} onChange={e => setSlotDate(e.target.value)} />
                      </div>
                      <div className="field">
                        <label>How long?</label>
                        <select value={slotHours} onChange={e => setSlotHours(e.target.value)}>
                          <option value="60">1 hour</option>
                          <option value="90">1.5 hours</option>
                          <option value="120">2 hours</option>
                          <option value="180">3 hours</option>
                          <option value="240">4 hours</option>
                        </select>
                      </div>
                    </div>
                    <p className="text-muted" style={{ fontSize: 12 }}>
                      Your buddy will accept or decline this request — you're only charged once they accept.
                    </p>
                  </div>
                )}
                <div className="card shadow">
                  <div className="section-h">payment</div>
                  <p style={{ fontSize: 14, lineHeight: 1.6, marginBottom: 12 }}>
                    {isService
                      ? 'No payment now — you pay only after your buddy accepts the request.'
                      : 'You\'ll be redirected to our secure Stripe checkout to pay by card or UPI.'}
                  </p>
                  <div className="row gap-8" style={{ flexWrap: 'wrap' }}>
                    <span className="pill pill-cobalt">Cards</span>
                    <span className="pill pill-cobalt">UPI</span>
                    <span className="pill pill-mint">Powered by Stripe</span>
                  </div>
                </div>
                <div className="card-soft">
                  <div className="section-h">cancellation</div>
                  <p style={{ fontSize: 13, lineHeight: 1.6 }}>
                    Free cancellation up to 24h before the experience. After that, 50% refunded if cancelled at least 6h before.
                  </p>
                </div>
                {err && <div className="pill pill-error">{err}</div>}
                <button className="btn btn-primary btn-lg" onClick={handlePayment} disabled={loading || (isService && !slotDate)}>
                  {loading ? 'Processing…' : isService ? `Send request · ${sym(event.currency)}${total.toLocaleString()} →` : `Pay ${sym(event.currency)}${total.toLocaleString()} →`}
                </button>
                <p className="text-muted mono" style={{ fontSize: 11, textAlign: 'center' }}>secure · 256-bit · no card stored</p>
              </div>

              <aside className="card shadow" style={{ padding: 0, overflow: 'hidden', height: 'fit-content', position: 'sticky', top: 80 }}>
                <Photo label={event.category || event.event_type} color={CATEGORY_COLORS[event.category || ''] || colorForId(event.id)} height={160} radius={0} />
                <div style={{ padding: 18 }}>
                  <div className="section-h">order summary</div>
                  <h3 className="h3" style={{ marginBottom: 12, lineHeight: 1.3 }}>{event.title}</h3>
                  <div className="row gap-8" style={{ marginBottom: 14, flexWrap: 'wrap' }}>
                    <span className="pill pill-cobalt">{event.event_type}</span>
                    <span className="pill pill-mint">{event.mode}</span>
                  </div>
                  {(isService ? slotDate : event.start_time) && (
                    <div className="text-muted mono" style={{ fontSize: 11, marginBottom: 14 }}>
                      {new Date(isService ? slotDate : event.start_time!).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  )}
                  <hr style={{ border: 'none', borderTop: '1px solid var(--line)', margin: '12px 0' }} />
                  <Row k={`${sym(event.currency)}${Math.round(event.price).toLocaleString()}/hr × ${hours} h`} v={`${sym(event.currency)}${total.toLocaleString()}`} />
                  <hr style={{ border: 'none', borderTop: '1px solid var(--line)', margin: '12px 0' }} />
                  <div className="row between">
                    <strong>Total</strong>
                    <strong className="display-2" style={{ fontSize: 24 }}>{sym(event.currency)}{total.toLocaleString()}</strong>
                  </div>
                </div>
              </aside>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="row between" style={{ fontSize: 13, padding: '4px 0' }}>
      <span className="text-muted">{k}</span><span>{v}</span>
    </div>
  );
}

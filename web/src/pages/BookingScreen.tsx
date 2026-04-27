import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, getToken } from '../api';
import { NavBar, Photo, Spinner, colorForId, CATEGORY_COLORS } from '../components/ui';

interface Event { id: number; title: string; price: number; event_type: string; mode: string; start_time?: string; category?: string; }

export default function BookingScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [event, setEvent] = useState<Event | null>(null);
  const [method, setMethod] = useState<'upi' | 'card'>('upi');
  const [upi, setUpi] = useState('you@oksbi');
  const [cardName, setCardName] = useState('Jane Doe');
  const [cardNumber, setCardNumber] = useState('4242 4242 4242 4242');

  useEffect(() => {
    (async () => {
      try {
        const r = await api.get('/events');
        const found = r.data.find((e: Event) => e.id.toString() === id);
        if (found) setEvent(found);
      } catch {}
    })();
  }, [id]);

  const handlePayment = async () => {
    setErr(null);
    setLoading(true);
    try {
      if (!getToken()) { navigate('/login'); return; }
      await api.post('/bookings', { event_id: parseInt(id || '0') });
      navigate(`/booking-success/${id}`);
    } catch (e: any) {
      setErr(e?.response?.data?.detail || 'Payment failed. Are you logged in?');
    } finally { setLoading(false); }
  };

  const fee = event ? Math.round(event.price * 0.05) : 0;
  const total = event ? event.price + fee : 0;

  return (
    <>
      <NavBar />
      <div className="page">
        <div className="container" style={{ maxWidth: 920 }}>
          <button className="btn btn-subtle btn-sm" style={{ marginBottom: 16 }} onClick={() => navigate(-1)}>← Back</button>
          <div className="eyebrow">step 2 of 2 · checkout</div>
          <h1 className="display-2" style={{ marginTop: 6, marginBottom: 28 }}>confirm & <span className="text-cobalt">pay.</span></h1>

          {!event ? <Spinner /> : (
            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 24 }}>
              <div className="stack gap-16">
                <div className="card shadow">
                  <div className="section-h">payment method</div>
                  <div className="row gap-8" style={{ marginBottom: 18 }}>
                    <button className={`chip ${method === 'upi' ? 'active' : ''}`} onClick={() => setMethod('upi')}>UPI</button>
                    <button className={`chip ${method === 'card' ? 'active' : ''}`} onClick={() => setMethod('card')}>Card</button>
                  </div>
                  {method === 'upi' ? (
                    <>
                      <div className="field">
                        <label>UPI ID</label>
                        <input type="text" value={upi} onChange={e => setUpi(e.target.value)} placeholder="name@oksbi" />
                      </div>
                      <div className="row gap-8" style={{ flexWrap: 'wrap' }}>
                        {['GPay','PhonePe','Paytm','BHIM'].map(p => (
                          <span key={p} className="pill pill-cobalt">{p}</span>
                        ))}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="field"><label>Cardholder</label><input value={cardName} onChange={e => setCardName(e.target.value)} /></div>
                      <div className="field"><label>Card number</label><input value={cardNumber} onChange={e => setCardNumber(e.target.value)} /></div>
                    </>
                  )}
                </div>
                <div className="card-soft">
                  <div className="section-h">cancellation</div>
                  <p style={{ fontSize: 13, lineHeight: 1.6 }}>
                    Free cancellation up to 24h before the experience. After that, 50% refunded if cancelled at least 6h before.
                  </p>
                </div>
                {err && <div className="pill pill-error">{err}</div>}
                <button className="btn btn-primary btn-lg" onClick={handlePayment} disabled={loading}>
                  {loading ? 'Processing…' : `Pay ₹${total} →`}
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
                  {event.start_time && (
                    <div className="text-muted mono" style={{ fontSize: 11, marginBottom: 14 }}>
                      {new Date(event.start_time).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  )}
                  <hr style={{ border: 'none', borderTop: '1px solid var(--line)', margin: '12px 0' }} />
                  <Row k="Seat × 1" v={`₹${event.price}`} />
                  <Row k="Service fee" v={`₹${fee}`} />
                  <hr style={{ border: 'none', borderTop: '1px solid var(--line)', margin: '12px 0' }} />
                  <div className="row between">
                    <strong>Total</strong>
                    <strong className="display-2" style={{ fontSize: 24 }}>₹{total}</strong>
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

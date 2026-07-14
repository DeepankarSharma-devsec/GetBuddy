import { useEffect, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { api } from '../api';
import { NavBar, Photo, Spinner, Empty, colorForId, CATEGORY_COLORS, SERVICE_CATEGORIES, durationLabel, totalPrice, getCountry, countryName, sym } from '../components/ui';

interface Event {
  id: number;
  listing_kind: string;
  title: string;
  description?: string;
  price: number;
  currency?: string;
  event_type: string;
  mode: string;
  start_time: string | null;
  category?: string;
  city?: string;
  host_id?: number;
  duration_minutes?: number;
}

const EVENT_CATS = [
  { id: 'all', label: 'Everything' },
  { id: 'music', label: 'Music' },
  { id: 'tech', label: 'Tech' },
  { id: 'lifestyle', label: 'Lifestyle' },
  { id: 'business', label: 'Business' },
  { id: 'food', label: 'Food' },
  { id: 'outdoor', label: 'Outdoor' },
];

const SERVICE_CATS = [{ id: 'all', label: 'Everything' }, ...SERVICE_CATEGORIES];

export default function Explore() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const params = new URLSearchParams(location.search);
  const kind = params.get('kind') === 'SERVICE' ? 'SERVICE' : 'EVENT';
  const activeCat = params.get('category') || 'all';

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const response = await api.get(`/events?kind=${kind}&country=${getCountry()}`);
        let data: Event[] = response.data;
        const p = new URLSearchParams(location.search);
        const q = p.get('q'); const cat = p.get('category');
        const type = p.get('type'); const mode = p.get('mode');
        if (q) data = data.filter(e => e.title.toLowerCase().includes(q.toLowerCase()));
        if (cat) data = data.filter(e => e.category === cat);
        if (type) data = data.filter(e => e.event_type === type);
        if (mode) data = data.filter(e => e.mode === mode);
        setEvents(data);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    })();
  }, [location.search, kind]);

  const setKind = (k: 'EVENT' | 'SERVICE') => {
    navigate(k === 'SERVICE' ? '/explore?kind=SERVICE' : '/explore');
  };

  const setCat = (c: string) => {
    const p = new URLSearchParams(location.search);
    if (c === 'all') p.delete('category'); else p.set('category', c);
    navigate(`/explore?${p.toString()}`);
  };

  const isService = kind === 'SERVICE';
  const cats = isService ? SERVICE_CATS : EVENT_CATS;

  return (
    <>
      <NavBar />
      <div className="page">
        <div className="container">
          <div className="hero" style={{ marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 24 }}>
            <div>
              <div className="eyebrow" style={{ marginBottom: 12 }}>discover · {countryName(getCountry()).toLowerCase()}</div>
              {isService ? (
                <>
                  <h1 className="display-2">a buddy for<br/><span className="text-cobalt">anything.</span></h1>
                  <p className="text-muted" style={{ marginTop: 12, maxWidth: 460 }}>
                    Movie partners, shopping buddies, someone to just hang out with. Pick your hours, send a request, they accept — that's it.
                  </p>
                </>
              ) : (
                <>
                  <h1 className="display-2">good evenings,<br/>found <span className="text-coral">in person.</span></h1>
                  <p className="text-muted" style={{ marginTop: 12, maxWidth: 460 }}>
                    Slow dinners, sunset treks, jam nights, couch tournaments. Hosted by people who actually care if you have a good time.
                  </p>
                </>
              )}
            </div>
            <Link to="/search" className="btn btn-primary btn-lg">Search & filter →</Link>
          </div>

          {/* kind tabs */}
          <div className="row gap-8" style={{ marginBottom: 18 }}>
            <button className={`btn ${!isService ? 'btn-primary' : 'btn-subtle'}`} onClick={() => setKind('EVENT')}>Events</button>
            <button className={`btn ${isService ? 'btn-primary' : 'btn-subtle'}`} onClick={() => setKind('SERVICE')}>Buddies</button>
          </div>

          <div className="row gap-8" style={{ flexWrap: 'wrap', marginBottom: 28 }}>
            {cats.map(c => (
              <button key={c.id} className={`chip ${activeCat === c.id ? 'active' : ''}`} onClick={() => setCat(c.id)}>{c.label}</button>
            ))}
          </div>

          {loading ? <Spinner /> : events.length === 0 ? (
            <Empty
              title={isService ? 'No buddies in this category yet' : 'No experiences match'}
              hint={isService ? 'Try another category — or become the first buddy here.' : 'Try a different category or open search to widen the net.'}
              action={<Link to={isService ? '/host/onboarding' : '/search'} className="btn btn-primary">{isService ? 'Become a buddy' : 'Open search'}</Link>} />
          ) : (
            <div className="grid grid-3">
              {events.map(ev => (
                <article key={ev.id} className="card card-clickable shadow" onClick={() => navigate(`/listing/${ev.id}`)} style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 0, overflow: 'hidden' }}>
                  <Photo label={ev.category || ev.event_type} color={CATEGORY_COLORS[ev.category || ''] || colorForId(ev.id)} height={180} radius={0} />
                  <div style={{ padding: '4px 16px 16px' }}>
                    <div className="row gap-8" style={{ marginBottom: 8, flexWrap: 'wrap' }}>
                      {ev.category && <span className="pill">{ev.category}</span>}
                      {!isService && <span className="pill pill-cobalt">{ev.event_type}</span>}
                      <span className="pill pill-mint">{ev.mode}</span>
                    </div>
                    <h3 className="h3" style={{ marginBottom: 8, lineHeight: 1.2 }}>{ev.title}</h3>
                    {isService ? (
                      <>
                        <div className="text-muted mono" style={{ fontSize: 11, marginBottom: 12 }}>
                          {ev.city || 'anywhere'} · you pick the hours
                        </div>
                        <div className="row between" style={{ alignItems: 'flex-end' }}>
                          <div>
                            <span className="h3">{sym(ev.currency)}{Math.round(ev.price).toLocaleString()}<span className="text-muted" style={{ fontSize: 13 }}>/hr</span></span>
                          </div>
                          <span className="btn btn-ghost btn-sm">Request →</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="text-muted mono" style={{ fontSize: 11, marginBottom: 12 }}>
                          {ev.start_time && new Date(ev.start_time).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })} · {durationLabel(ev.duration_minutes)}
                        </div>
                        <div className="row between" style={{ alignItems: 'flex-end' }}>
                          <div>
                            <span className="h3">{sym(ev.currency)}{totalPrice(ev.price, ev.duration_minutes).toLocaleString()}</span>
                            <div className="text-muted mono" style={{ fontSize: 10, marginTop: 2 }}>{sym(ev.currency)}{Math.round(ev.price).toLocaleString()}/hr · {durationLabel(ev.duration_minutes)}</div>
                          </div>
                          <span className="btn btn-ghost btn-sm">Details →</span>
                        </div>
                      </>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

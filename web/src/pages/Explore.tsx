import { useEffect, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { api } from '../api';
import { NavBar, Photo, StatusPill, Spinner, Empty, colorForId, CATEGORY_COLORS } from '../components/ui';

interface Event {
  id: number;
  title: string;
  description?: string;
  price: number;
  event_type: string;
  mode: string;
  start_time: string;
  category?: string;
  host_id?: number;
}

const CATS = [
  { id: 'all', label: 'Everything' },
  { id: 'music', label: 'Music' },
  { id: 'tech', label: 'Tech' },
  { id: 'lifestyle', label: 'Lifestyle' },
  { id: 'business', label: 'Business' },
];

export default function Explore() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const response = await api.get('/events');
        let data: Event[] = response.data;
        const params = new URLSearchParams(location.search);
        const q = params.get('q'); const cat = params.get('category');
        const type = params.get('type'); const mode = params.get('mode');
        if (q) data = data.filter(e => e.title.toLowerCase().includes(q.toLowerCase()));
        if (cat) data = data.filter(e => e.category === cat);
        if (type) data = data.filter(e => e.event_type === type);
        if (mode) data = data.filter(e => e.mode === mode);
        setEvents(data);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    })();
  }, [location.search]);

  const params = new URLSearchParams(location.search);
  const activeCat = params.get('category') || 'all';

  const setCat = (c: string) => {
    const p = new URLSearchParams(location.search);
    if (c === 'all') p.delete('category'); else p.set('category', c);
    navigate(`/explore?${p.toString()}`);
  };

  return (
    <>
      <NavBar />
      <div className="page">
        <div className="container">
          <div className="hero" style={{ marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 24 }}>
            <div>
              <div className="eyebrow" style={{ marginBottom: 12 }}>discover · bengaluru</div>
              <h1 className="display-2">good evenings,<br/>found <span className="text-coral">in person.</span></h1>
              <p className="text-muted" style={{ marginTop: 12, maxWidth: 460 }}>
                Slow dinners, sunset treks, jam nights, couch tournaments. Hosted by people who actually care if you have a good time.
              </p>
            </div>
            <Link to="/search" className="btn btn-primary btn-lg">Search & filter →</Link>
          </div>

          <div className="row gap-8" style={{ flexWrap: 'wrap', marginBottom: 28 }}>
            {CATS.map(c => (
              <button key={c.id} className={`chip ${activeCat === c.id ? 'active' : ''}`} onClick={() => setCat(c.id)}>{c.label}</button>
            ))}
          </div>

          {loading ? <Spinner /> : events.length === 0 ? (
            <Empty title="No experiences match" hint="Try a different category or open search to widen the net."
              action={<Link to="/search" className="btn btn-primary">Open search</Link>} />
          ) : (
            <div className="grid grid-3">
              {events.map(ev => (
                <article key={ev.id} className="card card-clickable shadow" onClick={() => navigate(`/listing/${ev.id}`)} style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 0, overflow: 'hidden' }}>
                  <Photo label={ev.category || ev.event_type} color={CATEGORY_COLORS[ev.category || ''] || colorForId(ev.id)} height={180} radius={0} />
                  <div style={{ padding: '4px 16px 16px' }}>
                    <div className="row gap-8" style={{ marginBottom: 8, flexWrap: 'wrap' }}>
                      {ev.category && <span className="pill">{ev.category}</span>}
                      <span className="pill pill-cobalt">{ev.event_type}</span>
                      <span className="pill pill-mint">{ev.mode}</span>
                    </div>
                    <h3 className="h3" style={{ marginBottom: 8, lineHeight: 1.2 }}>{ev.title}</h3>
                    <div className="text-muted mono" style={{ fontSize: 11, marginBottom: 12 }}>
                      {new Date(ev.start_time).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div className="row between">
                      <span className="h3">₹{Math.round(ev.price)}</span>
                      <span className="btn btn-ghost btn-sm">Details →</span>
                    </div>
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

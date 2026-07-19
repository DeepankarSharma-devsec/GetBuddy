import { useEffect, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { api } from '../api';
import { NavBar, Photo, Spinner, Empty, colorForId, CATEGORY_COLORS, SERVICE_CATEGORIES, durationLabel, totalPrice, getCountry, countryName, getCity, setCity as persistCity, sym } from '../components/ui';

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
  cover_image?: string | null;
  traveller_friendly?: boolean;
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

export function ListingCard({ ev, onClick }: { ev: Event; onClick: () => void }) {
  const isService = ev.listing_kind === 'SERVICE';
  return (
    <article className="card card-clickable shadow" onClick={onClick} style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 0, overflow: 'hidden' }}>
      <Photo label={ev.category || ev.event_type} color={CATEGORY_COLORS[ev.category || ''] || colorForId(ev.id)} height={180} radius={0} src={ev.cover_image || undefined} />
      <div style={{ padding: '4px 16px 16px' }}>
        <div className="row gap-8" style={{ marginBottom: 8, flexWrap: 'wrap' }}>
          <span className={`pill ${isService ? 'pill-buddy' : 'pill-event'}`}>{isService ? 'buddy' : 'event'}</span>
          {ev.category && <span className="pill">{ev.category}</span>}
          <span className="pill pill-mint">{ev.mode}</span>
          {ev.traveller_friendly && <span className="pill pill-yellow">✈ visitor-friendly</span>}
        </div>
        <h3 className="h3" style={{ marginBottom: 8, lineHeight: 1.2 }}>{ev.title}</h3>
        {isService ? (
          <>
            <div className="text-muted mono" style={{ fontSize: 11, marginBottom: 12 }}>
              {ev.city || 'anywhere'} · you pick the hours
            </div>
            <div className="row between" style={{ alignItems: 'flex-end' }}>
              <span className="h3">{sym(ev.currency)}{Math.round(ev.price).toLocaleString()}<span className="text-muted" style={{ fontSize: 13 }}>/hr</span></span>
              <span className="btn btn-ghost btn-sm">Request →</span>
            </div>
          </>
        ) : (
          <>
            <div className="text-muted mono" style={{ fontSize: 11, marginBottom: 12 }}>
              {ev.start_time && new Date(ev.start_time).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })} · {durationLabel(ev.duration_minutes)}{ev.city ? ` · ${ev.city}` : ''}
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
  );
}

export default function Explore() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const params = new URLSearchParams(location.search);
  const kind = params.get('kind') === 'SERVICE' ? 'SERVICE' : 'EVENT';
  const activeCat = params.get('category') || 'all';
  const city = params.get('city') ?? getCity();
  const [cityInput, setCityInput] = useState(city);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        // Server-side filtering (item 11) — the backend handles q/city/category/mode
        const p = new URLSearchParams(location.search);
        p.set('kind', kind);
        p.set('country', getCountry());
        if (!p.get('city') && city) p.set('city', city);
        p.delete('type'); // legacy param
        const response = await api.get(`/events?${p.toString()}`);
        let data: Event[] = response.data;
        const type = new URLSearchParams(location.search).get('type');
        if (type) data = data.filter(e => e.event_type === type);
        setEvents(data);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    })();
  }, [location.search, kind, city]);

  const setParam = (key: string, value: string | null) => {
    const p = new URLSearchParams(location.search);
    if (value) p.set(key, value); else p.delete(key);
    navigate(`/explore?${p.toString()}`);
  };

  const applyCity = () => {
    persistCity(cityInput.trim());
    setParam('city', cityInput.trim() || null);
  };

  const setKind = (k: 'EVENT' | 'SERVICE') => {
    const p = new URLSearchParams();
    if (k === 'SERVICE') p.set('kind', 'SERVICE');
    if (city) p.set('city', city);
    navigate(`/explore?${p.toString()}`);
  };

  const setCat = (c: string) => setParam('category', c === 'all' ? null : c);

  const isService = kind === 'SERVICE';
  const cats = isService ? SERVICE_CATS : EVENT_CATS;
  const travellerPicks = events.filter(e => e.traveller_friendly).slice(0, 3);

  return (
    <>
      <NavBar />
      <div className="page">
        <div className="container">
          <div className={`hero ${isService ? 'hero-buddy' : ''}`} style={{ marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 24 }}>
            <div>
              <div className="row gap-8" style={{ marginBottom: 12, flexWrap: 'wrap' }}>
                <span className="ticket-badge">est. 2026 · {countryName(getCountry())}</span>
                {city && <span className="ticket-badge">📍 {city}</span>}
              </div>
              {isService ? (
                <>
                  <h1 className="display-2 vintage-head">a buddy for<br /><em className="text-cobalt">anything.</em></h1>
                  <p className="text-muted" style={{ marginTop: 12, maxWidth: 460 }}>
                    Movie partners, shopping buddies, someone to just hang out with. Pick your hours, send a request, they accept — that's it.
                  </p>
                </>
              ) : (
                <>
                  <h1 className="display-2 vintage-head">good evenings,<br />found <em className="text-coral">in person.</em></h1>
                  <p className="text-muted" style={{ marginTop: 12, maxWidth: 460 }}>
                    Slow dinners, sunset treks, jam nights, couch tournaments. Hosted by people who actually care if you have a good time.
                  </p>
                </>
              )}
            </div>
            <div className="stack gap-8" style={{ minWidth: 240 }}>
              {/* Home feed city (item 10): anyone can browse any city, visitor or local */}
              <div className="row gap-8">
                <input value={cityInput} onChange={e => setCityInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && applyCity()}
                  placeholder="Which city? e.g. Bengaluru"
                  style={{ border: '1.5px solid var(--ink)', borderRadius: 'var(--r-pill)', padding: '10px 16px', background: 'var(--paper)', outline: 'none', flex: 1, fontSize: 13 }} />
                <button className="btn btn-primary btn-sm" onClick={applyCity}>Go</button>
              </div>
              {city && <button className="btn btn-subtle btn-sm" onClick={() => { setCityInput(''); persistCity(''); setParam('city', null); }}>× Clear city — show everywhere</button>}
              <Link to="/search" className="btn btn-ghost btn-sm">Search & filter →</Link>
            </div>
          </div>

          {/* kind tabs — two different products, two different colours (items 7/8) */}
          <div className="row gap-8" style={{ marginBottom: 18 }}>
            <button className={`btn ${!isService ? 'btn-coral' : 'btn-subtle'}`} onClick={() => setKind('EVENT')}>🎟 Events</button>
            <button className={`btn ${isService ? 'btn-cobalt' : 'btn-subtle'}`} onClick={() => setKind('SERVICE')}>🤝 Buddies</button>
          </div>

          <div className="row gap-8" style={{ flexWrap: 'wrap', marginBottom: 28 }}>
            {cats.map(c => (
              <button key={c.id} className={`chip ${activeCat === c.id ? 'active' : ''}`} onClick={() => setCat(c.id)}>{c.label}</button>
            ))}
          </div>

          {/* item 1: window for visitors & foreigners */}
          {!loading && travellerPicks.length > 0 && (
            <section style={{ marginBottom: 32 }}>
              <div className="row gap-8" style={{ marginBottom: 12, alignItems: 'center' }}>
                <div className="section-h" style={{ margin: 0 }}>✈ visiting{city ? ` ${city.toLowerCase()}` : ''}? start here</div>
                <span className="pill pill-yellow">english-friendly · no local knowledge needed</span>
                <Link to="/visiting" className="btn btn-subtle btn-sm">See all →</Link>
              </div>
              <div className="grid grid-3">
                {travellerPicks.map(ev => <ListingCard key={ev.id} ev={ev} onClick={() => navigate(`/listing/${ev.id}`)} />)}
              </div>
            </section>
          )}

          {loading ? <Spinner /> : events.length === 0 ? (
            <Empty
              title={isService ? 'No buddies match' : 'No experiences match'}
              hint={city ? `Nothing in ${city} yet — clear the city or try another one.` : (isService ? 'Try another category — or become the first buddy here.' : 'Try a different category or open search to widen the net.')}
              action={<Link to={isService ? '/host/onboarding' : '/search'} className="btn btn-primary">{isService ? 'Become a buddy' : 'Open search'}</Link>} />
          ) : (
            <div className="grid grid-3">
              {events.map(ev => <ListingCard key={ev.id} ev={ev} onClick={() => navigate(`/listing/${ev.id}`)} />)}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

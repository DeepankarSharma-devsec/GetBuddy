import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { NavBar, Spinner, Empty, getCountry, getCity, setCity as persistCity } from '../components/ui';
import { ListingCard } from './Explore';

// Item 1: a dedicated window for visitors & foreigners — everything
// traveller-friendly in one place, split into events and buddies.
export default function Visiting() {
  const [events, setEvents] = useState<any[]>([]);
  const [buddies, setBuddies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [city, setCityState] = useState(getCity());
  const [cityInput, setCityInput] = useState(getCity());
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const base = `traveller=true&country=${getCountry()}${city ? `&city=${encodeURIComponent(city)}` : ''}`;
        const [ev, bu] = await Promise.all([
          api.get(`/events?kind=EVENT&${base}`),
          api.get(`/events?kind=SERVICE&${base}`),
        ]);
        setEvents(ev.data); setBuddies(bu.data);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, [city]);

  const applyCity = () => { persistCity(cityInput.trim()); setCityState(cityInput.trim()); };

  return (
    <>
      <NavBar />
      <div className="page">
        <div className="container">
          <div className="hero hero-host" style={{ marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 24 }}>
            <div>
              <span className="ticket-badge" style={{ marginBottom: 12 }}>✈ the visitors' window</span>
              <h1 className="display-2 vintage-head" style={{ marginTop: 10 }}>
                new in town?<br />you're <em className="text-coral">expected.</em>
              </h1>
              <p className="text-muted" style={{ marginTop: 12, maxWidth: 480, lineHeight: 1.6 }}>
                Every listing here is flagged by its host as great for visitors and foreigners —
                English-friendly, no local knowledge needed. Land, pick a city, have plans by evening.
              </p>
            </div>
            <div className="stack gap-8" style={{ minWidth: 240 }}>
              <div className="row gap-8">
                <input value={cityInput} onChange={e => setCityInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && applyCity()}
                  placeholder="Where are you visiting?"
                  style={{ border: '1.5px solid var(--ink)', borderRadius: 'var(--r-pill)', padding: '10px 16px', background: 'var(--paper)', outline: 'none', flex: 1, fontSize: 13 }} />
                <button className="btn btn-primary btn-sm" onClick={applyCity}>Go</button>
              </div>
              {city && <button className="btn btn-subtle btn-sm" onClick={() => { setCityInput(''); persistCity(''); setCityState(''); }}>× All cities</button>}
            </div>
          </div>

          {loading ? <Spinner /> : (
            <>
              <div className="row gap-8" style={{ marginBottom: 12, alignItems: 'center' }}>
                <div className="section-h" style={{ margin: 0 }}>🎟 events worth landing for</div>
                <span className="pill pill-event">{events.length}</span>
              </div>
              {events.length === 0 ? (
                <div className="card-soft text-muted" style={{ fontSize: 13, marginBottom: 32 }}>
                  No visitor-friendly events{city ? ` in ${city}` : ''} yet — try another city or browse everything on Explore.
                </div>
              ) : (
                <div className="grid grid-3" style={{ marginBottom: 36 }}>
                  {events.map(ev => <ListingCard key={ev.id} ev={ev} onClick={() => navigate(`/listing/${ev.id}`)} />)}
                </div>
              )}

              <div className="row gap-8" style={{ marginBottom: 12, alignItems: 'center' }}>
                <div className="section-h" style={{ margin: 0 }}>🤝 buddies who'll show you around</div>
                <span className="pill pill-buddy">{buddies.length}</span>
              </div>
              {buddies.length === 0 ? (
                <div className="card-soft text-muted" style={{ fontSize: 13, marginBottom: 32 }}>
                  No visitor-friendly buddies{city ? ` in ${city}` : ''} yet.
                </div>
              ) : (
                <div className="grid grid-3" style={{ marginBottom: 36 }}>
                  {buddies.map(ev => <ListingCard key={ev.id} ev={ev} onClick={() => navigate(`/listing/${ev.id}`)} />)}
                </div>
              )}

              {events.length === 0 && buddies.length === 0 && (
                <Empty title="Nothing flagged here yet" hint="Hosts mark listings as visitor-friendly when publishing — check back, or browse the full catalog."
                  action={<button className="btn btn-primary" onClick={() => navigate('/explore')}>Browse everything →</button>} />
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

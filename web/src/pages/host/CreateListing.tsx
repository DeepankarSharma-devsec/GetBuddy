import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, getToken, apiError } from '../../api';
import { NavBar, SERVICE_CATEGORIES, COUNTRIES, sym } from '../../components/ui';

export default function CreateListing() {
  const [kind, setKind] = useState<'EVENT' | 'SERVICE'>('EVENT');
  const [currency, setCurrency] = useState('INR');
  useEffect(() => {
    // Listings are priced in the host's own currency
    api.get('/users/me').then(r => {
      const c = COUNTRIES.find(c => c.code === r.data.country);
      if (c) setCurrency(c.currency);
    }).catch(() => {});
  }, []);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [eventType, setEventType] = useState('1:1 Session');
  const [mode, setMode] = useState('Online');
  const [category, setCategory] = useState('lifestyle');
  const [city, setCity] = useState('');
  const [duration, setDuration] = useState('60');
  const [maxParticipants, setMaxParticipants] = useState('1');
  const [date, setDate] = useState('');
  const [locationDetails, setLocationDetails] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const isService = kind === 'SERVICE';
  const hours = parseInt(duration) / 60;
  const total = (parseFloat(price) || 0) * hours;

  const switchKind = (k: 'EVENT' | 'SERVICE') => {
    setKind(k);
    setCategory(k === 'SERVICE' ? 'hangout' : 'lifestyle');
    if (k === 'SERVICE') setEventType('1:1 Session');
  };

  const submit = async (status: 'ACTIVE' | 'DRAFT') => {
    setErr(null); setLoading(true);
    try {
      if (!getToken()) { navigate('/login'); return; }
      await api.post('/events', {
        listing_kind: kind,
        title, description,
        price: parseFloat(price) || 0,
        event_type: isService ? '1:1 Session' : eventType,
        mode, category,
        city: city || null,
        duration_minutes: isService ? 60 : parseInt(duration),
        max_participants: isService ? 1 : parseInt(maxParticipants) || 1,
        start_time: isService ? null : (date || new Date().toISOString()),
        location_details: locationDetails,
        status,
      });
      navigate('/host/dashboard');
    } catch (e: any) {
      setErr(apiError(e, 'Failed to publish listing.'));
    } finally { setLoading(false); }
  };

  return (
    <>
      <NavBar />
      <div className="page">
        <div className="container" style={{ maxWidth: 800 }}>
          <button className="btn btn-subtle btn-sm" style={{ marginBottom: 16 }} onClick={() => navigate(-1)}>← Cancel</button>
          <div className="eyebrow">host studio</div>
          <h1 className="display-2" style={{ marginTop: 6, marginBottom: 24 }}>publish a <span className="text-coral">listing.</span></h1>

          <div className="card shadow" style={{ marginBottom: 16 }}>
            <div className="section-h">what are you listing?</div>
            <div className="row gap-8" style={{ marginBottom: 6 }}>
              <button className={`btn ${!isService ? 'btn-primary' : 'btn-subtle'}`} onClick={() => switchKind('EVENT')}>Host an event</button>
              <button className={`btn ${isService ? 'btn-primary' : 'btn-subtle'}`} onClick={() => switchKind('SERVICE')}>Offer a buddy service</button>
            </div>
            <p className="text-muted" style={{ fontSize: 12 }}>
              {isService
                ? 'An ongoing per-hour offering — guests request a date, time, and hours; you accept or decline.'
                : 'A one-off happening with a fixed date, duration, and number of seats.'}
            </p>
          </div>

          <div className="card shadow" style={{ marginBottom: 16 }}>
            <div className="section-h">basics</div>
            <div className="field">
              <label>Title</label>
              <input value={title} onChange={e => setTitle(e.target.value)}
                placeholder={isService ? 'Movie Partner: weekend shows & popcorn debates' : 'A long, slow South Indian dinner'} />
            </div>
            <div className="field">
              <label>Description</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4}
                placeholder="Four slow courses plated at the table — appam, avial, ghee-roast, payasam. We chat. We eat. We don't rush." />
            </div>
            <div className="input-row">
              <div className="field">
                <label>Rate ({sym(currency)} / hour)</label>
                <input type="number" min="0" value={price} onChange={e => setPrice(e.target.value)} placeholder={isService ? '250' : '900'} />
              </div>
              {!isService && (
                <>
                  <div className="field">
                    <label>Duration</label>
                    <select value={duration} onChange={e => setDuration(e.target.value)}>
                      <option value="30">30 min</option>
                      <option value="60">1 hour</option>
                      <option value="90">1.5 hours</option>
                      <option value="120">2 hours</option>
                      <option value="180">3 hours</option>
                    </select>
                  </div>
                  <div className="field">
                    <label>Date & time</label>
                    <input type="datetime-local" value={date} onChange={e => setDate(e.target.value)} />
                  </div>
                </>
              )}
            </div>
            {price && (
              <p className="text-muted mono" style={{ fontSize: 12 }}>
                {isService
                  ? `Guests pick their hours · you receive ${sym(currency)}${((parseFloat(price) || 0) * 0.85).toFixed(0)} per hour (after 15% platform fee)`
                  : `Guests pay ${sym(currency)}${total.toFixed(0)} per seat · you receive ${sym(currency)}${(total * 0.85).toFixed(0)} (after 15% platform fee)`}
              </p>
            )}
          </div>

          <div className="card shadow" style={{ marginBottom: 16 }}>
            <div className="section-h">format</div>
            <div className="input-row">
              {!isService && (
                <div className="field">
                  <label>Session type</label>
                  <select value={eventType} onChange={e => setEventType(e.target.value)}>
                    <option value="1:1 Session">1:1 Session</option>
                    <option value="Group Session">Group Session</option>
                    <option value="Online Event">Online Event</option>
                    <option value="Offline Event">Offline Event</option>
                  </select>
                </div>
              )}
              <div className="field">
                <label>Category</label>
                <select value={category} onChange={e => setCategory(e.target.value)}>
                  {isService ? (
                    SERVICE_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)
                  ) : (
                    <>
                      <option value="music">Music</option>
                      <option value="tech">Technology</option>
                      <option value="lifestyle">Lifestyle</option>
                      <option value="business">Business</option>
                      <option value="food">Food</option>
                      <option value="outdoor">Outdoor</option>
                    </>
                  )}
                </select>
              </div>
            </div>
            <div className="input-row">
              <div className="field">
                <label>Mode</label>
                <select value={mode} onChange={e => setMode(e.target.value)}>
                  <option value="Online">Online</option>
                  <option value="Offline">Offline</option>
                </select>
              </div>
              {isService ? (
                <div className="field">
                  <label>City</label>
                  <input type="text" value={city} onChange={e => setCity(e.target.value)} placeholder="Bengaluru" />
                </div>
              ) : (
                <div className="field">
                  <label>Max guests</label>
                  <input type="number" min="1" value={maxParticipants} onChange={e => setMaxParticipants(e.target.value)} />
                </div>
              )}
            </div>
            <div className="field">
              <label>{mode === 'Online' ? 'Meeting link' : isService ? 'Usual meeting area' : 'Address / meeting point'}</label>
              <input value={locationDetails} onChange={e => setLocationDetails(e.target.value)}
                placeholder={mode === 'Online' ? 'https://meet.google.com/…' : isService ? 'e.g. malls around Indiranagar — exact spot per booking' : '12, 5th Cross, Indiranagar'} />
              <p className="text-muted" style={{ fontSize: 11, marginTop: 4 }}>
                {isService ? 'Only revealed to guests after you accept their request.' : 'Only revealed to guests after they book.'}
              </p>
            </div>
          </div>

          {err && <div className="pill pill-error" style={{ marginBottom: 12 }}>{err}</div>}
          <div className="row gap-12">
            <button className="btn btn-subtle grow" onClick={() => submit('DRAFT')} disabled={!title || !price || loading}>
              {loading ? '…' : 'Save draft'}
            </button>
            <button className="btn btn-primary grow" onClick={() => submit('ACTIVE')} disabled={!title || !price || loading}>
              {loading ? '…' : 'Publish listing →'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

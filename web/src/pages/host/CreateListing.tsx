import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api, getToken, apiError } from '../../api';
import { NavBar, Photo, ImageInput, SERVICE_CATEGORIES, COUNTRIES, CATEGORY_COLORS, colorForId, sym } from '../../components/ui';

// Live examples so first-time hosts can see how others fill this in (item 6)
function ExamplesRail({ kind }: { kind: 'EVENT' | 'SERVICE' }) {
  const [examples, setExamples] = useState<any[]>([]);
  useEffect(() => {
    api.get(`/events?kind=${kind}&limit=3`).then(r => setExamples(r.data.slice(0, 3))).catch(() => {});
  }, [kind]);

  const tips = kind === 'SERVICE' ? [
    'Name the vibe, not just the service — “Movie Partner: popcorn debates included”.',
    'Say which areas of your city you cover.',
    'A fair hourly rate gets more first requests — you can raise it once reviews land.',
  ] : [
    'Put the plan in the description: what happens, in what order.',
    'Small groups (4–8 seats) book out faster than large ones.',
    'Set the date at least 3 days out so people can plan.',
  ];

  return (
    <aside className="stack gap-12" style={{ height: 'fit-content' }}>
      <div className="section-h" style={{ margin: 0 }}>how others did it</div>
      {examples.length === 0 ? (
        <div className="card-soft text-muted" style={{ fontSize: 13 }}>
          No live {kind === 'SERVICE' ? 'buddy services' : 'events'} to show yet — yours could be the first!
        </div>
      ) : examples.map(ev => (
        <div key={ev.id} className="card-soft" style={{ padding: 0, overflow: 'hidden' }}>
          <Photo label={ev.category || ev.event_type} color={CATEGORY_COLORS[ev.category || ''] || colorForId(ev.id)} height={70} radius={0} src={ev.cover_image || undefined} />
          <div style={{ padding: '8px 12px 12px' }}>
            <div style={{ fontWeight: 600, fontSize: 13, lineHeight: 1.3 }}>{ev.title}</div>
            <div className="text-muted mono" style={{ fontSize: 10, marginTop: 4 }}>
              {sym(ev.currency)}{Math.round(ev.price).toLocaleString()}/hr{ev.city ? ` · ${ev.city}` : ''}
            </div>
          </div>
        </div>
      ))}
      <div className="section-h" style={{ margin: '8px 0 0' }}>quick tips</div>
      {tips.map(t => (
        <div key={t} className="text-muted" style={{ fontSize: 12, lineHeight: 1.5, paddingLeft: 10, borderLeft: `3px solid var(${kind === 'SERVICE' ? '--accent-buddy' : '--accent-event'})` }}>{t}</div>
      ))}
    </aside>
  );
}

export default function CreateListing() {
  const { id: editId } = useParams();  // /host/edit/:id reuses this form
  const isEdit = !!editId;
  const [kind, setKind] = useState<'EVENT' | 'SERVICE'>('EVENT');
  const [currency, setCurrency] = useState('INR');
  const [myCommunities, setMyCommunities] = useState<any[]>([]);
  useEffect(() => {
    // Listings are priced in the host's own currency
    api.get('/users/me').then(r => {
      const c = COUNTRIES.find(c => c.code === r.data.country);
      if (c) setCurrency(c.currency);
    }).catch(() => {});
    api.get('/communities/mine').then(r => setMyCommunities(r.data.filter((c: any) => c.is_owner))).catch(() => {});
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
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [travellerFriendly, setTravellerFriendly] = useState(false);
  const [communityId, setCommunityId] = useState('');
  const [editDeadline, setEditDeadline] = useState<Date | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Edit mode: prefill from the listing (allowed for 1 hour after creation)
  useEffect(() => {
    if (!editId) return;
    api.get(`/events/${editId}`).then(r => {
      const e = r.data;
      setKind(e.listing_kind);
      setTitle(e.title); setDescription(e.description || '');
      setPrice(String(e.price)); setEventType(e.event_type); setMode(e.mode);
      setCategory(e.category || 'lifestyle'); setCity(e.city || '');
      setDuration(String(e.duration_minutes || 60)); setMaxParticipants(String(e.max_participants || 1));
      setDate(e.start_time ? e.start_time.slice(0, 16) : '');
      setCoverImage(e.cover_image || null);
      setTravellerFriendly(!!e.traveller_friendly);
      if (e.created_at) setEditDeadline(new Date(new Date(e.created_at + 'Z').getTime() + 60 * 60 * 1000));
    }).catch(() => setErr('Could not load this listing.'));
  }, [editId]);

  const isService = kind === 'SERVICE';
  const hours = parseInt(duration) / 60;
  const total = (parseFloat(price) || 0) * hours;

  const switchKind = (k: 'EVENT' | 'SERVICE') => {
    if (isEdit) return;
    setKind(k);
    setCategory(k === 'SERVICE' ? 'hangout' : 'lifestyle');
    if (k === 'SERVICE') setEventType('1:1 Session');
  };

  const submit = async (status: 'ACTIVE' | 'DRAFT') => {
    setErr(null); setLoading(true);
    try {
      if (!getToken()) { navigate('/login'); return; }
      const payload = {
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
        cover_image: coverImage,
        traveller_friendly: travellerFriendly,
        community_id: !isEdit && communityId ? parseInt(communityId) : null,
        status,
      };
      if (isEdit) await api.put(`/events/${editId}`, payload);
      else await api.post('/events', payload);
      navigate('/host/dashboard');
    } catch (e: any) {
      setErr(apiError(e, isEdit ? 'Failed to update listing.' : 'Failed to publish listing.'));
    } finally { setLoading(false); }
  };

  return (
    <>
      <NavBar />
      <div className="page">
        <div className="container" style={{ maxWidth: 1080 }}>
          <button className="btn btn-subtle btn-sm" style={{ marginBottom: 16 }} onClick={() => navigate(-1)}>← Cancel</button>
          <div className="eyebrow">host studio</div>
          <h1 className="display-2" style={{ marginTop: 6, marginBottom: 8 }}>
            {isEdit ? <>rectify your <span className={isService ? 'text-cobalt' : 'text-coral'}>listing.</span></>
                    : <>publish a <span className={isService ? 'text-cobalt' : 'text-coral'}>listing.</span></>}
          </h1>
          {isEdit && editDeadline && (
            <div className="pill pill-yellow" style={{ marginBottom: 16 }}>
              ✎ edits close at {editDeadline.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} — 1 hour after publishing
            </div>
          )}
          <div style={{ height: 12 }} />

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 260px', gap: 28 }} className="create-split">
            <div>
              <div className="card shadow" style={{ marginBottom: 16 }}>
                <div className={`kind-strip ${isService ? 'buddy' : 'event'}`} />
                <div className="section-h">what are you listing?</div>
                <div className="row gap-8" style={{ marginBottom: 6 }}>
                  <button disabled={isEdit} className={`btn ${!isService ? 'btn-coral' : 'btn-subtle'}`} onClick={() => switchKind('EVENT')}>Host an event</button>
                  <button disabled={isEdit} className={`btn ${isService ? 'btn-cobalt' : 'btn-subtle'}`} onClick={() => switchKind('SERVICE')}>Offer a buddy service</button>
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
                <div className="field">
                  <label>Cover photo</label>
                  <ImageInput value={coverImage} onChange={setCoverImage} label="add a cover photo" />
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
                  <div className="field">
                    <label>City</label>
                    <input type="text" value={city} onChange={e => setCity(e.target.value)} placeholder="Bengaluru" />
                  </div>
                  {!isService && (
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
                <label className="row gap-8" style={{ cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                  <input type="checkbox" checked={travellerFriendly} onChange={e => setTravellerFriendly(e.target.checked)} style={{ width: 16, height: 16 }} />
                  ✈ Great for visitors & foreigners — English-friendly, no local knowledge needed
                </label>
              </div>

              {!isEdit && myCommunities.length > 0 && (
                <div className="card shadow" style={{ marginBottom: 16 }}>
                  <div className="section-h">audience</div>
                  <div className="field" style={{ marginBottom: 4 }}>
                    <label>Who can see this?</label>
                    <select value={communityId} onChange={e => setCommunityId(e.target.value)}>
                      <option value="">Everyone (public)</option>
                      {myCommunities.map(c => <option key={c.id} value={c.id}>Only my community: {c.name}</option>)}
                    </select>
                  </div>
                  <p className="text-muted" style={{ fontSize: 11 }}>Community listings stay off the public Explore page — only members see them.</p>
                </div>
              )}

              {err && <div className="pill pill-error" style={{ marginBottom: 12 }}>{err}</div>}
              <div className="row gap-12">
                {!isEdit && (
                  <button className="btn btn-subtle grow" onClick={() => submit('DRAFT')} disabled={!title || !price || loading}>
                    {loading ? '…' : 'Save draft'}
                  </button>
                )}
                <button className="btn btn-primary grow" onClick={() => submit('ACTIVE')} disabled={!title || !price || loading}>
                  {loading ? '…' : isEdit ? 'Save changes →' : 'Publish listing →'}
                </button>
              </div>
            </div>

            <ExamplesRail kind={kind} />
          </div>
        </div>
      </div>
    </>
  );
}

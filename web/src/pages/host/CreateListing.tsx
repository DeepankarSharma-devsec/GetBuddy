import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, getToken } from '../../api';
import { NavBar } from '../../components/ui';

export default function CreateListing() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [eventType, setEventType] = useState('1:1 Session');
  const [mode, setMode] = useState('Online');
  const [date, setDate] = useState('');
  const [locationDetails, setLocationDetails] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleCreate = async () => {
    setErr(null); setLoading(true);
    try {
      if (!getToken()) { navigate('/login'); return; }
      await api.post('/events', {
        title, description,
        price: parseFloat(price) || 0,
        event_type: eventType, mode,
        start_time: date || new Date().toISOString(),
        location_details: locationDetails,
      });
      navigate('/host/dashboard');
    } catch (e: any) {
      setErr(e?.response?.data?.detail || 'Failed to publish listing.');
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
            <div className="section-h">basics</div>
            <div className="field">
              <label>Title</label>
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder="A long, slow South Indian dinner" />
            </div>
            <div className="field">
              <label>Description</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4}
                placeholder="Four slow courses plated at the table — appam, avial, ghee-roast, payasam. We chat. We eat. We don't rush." />
            </div>
            <div className="input-row">
              <div className="field">
                <label>Price (₹)</label>
                <input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="900" />
              </div>
              <div className="field">
                <label>Date & time</label>
                <input type="datetime-local" value={date} onChange={e => setDate(e.target.value)} />
              </div>
            </div>
          </div>

          <div className="card shadow" style={{ marginBottom: 16 }}>
            <div className="section-h">format</div>
            <div className="input-row">
              <div className="field">
                <label>Session type</label>
                <select value={eventType} onChange={e => setEventType(e.target.value)}>
                  <option value="1:1 Session">1:1 Session</option>
                  <option value="Group Session">Group Session</option>
                  <option value="Online Event">Online Event</option>
                  <option value="Offline Event">Offline Event</option>
                </select>
              </div>
              <div className="field">
                <label>Mode</label>
                <select value={mode} onChange={e => setMode(e.target.value)}>
                  <option value="Online">Online</option>
                  <option value="Offline">Offline</option>
                </select>
              </div>
            </div>
            <div className="field">
              <label>{mode === 'Online' ? 'Meeting link' : 'Address / meeting point'}</label>
              <input value={locationDetails} onChange={e => setLocationDetails(e.target.value)}
                placeholder={mode === 'Online' ? 'https://meet.google.com/…' : '12, 5th Cross, Indiranagar'} />
              <p className="text-muted" style={{ fontSize: 11, marginTop: 4 }}>Only revealed to guests after they book.</p>
            </div>
          </div>

          {err && <div className="pill pill-error" style={{ marginBottom: 12 }}>{err}</div>}
          <div className="row gap-12">
            <button className="btn btn-subtle grow" onClick={() => navigate('/host/dashboard')}>Save draft</button>
            <button className="btn btn-primary grow" onClick={handleCreate} disabled={!title || !price || loading}>
              {loading ? '…' : 'Publish listing →'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

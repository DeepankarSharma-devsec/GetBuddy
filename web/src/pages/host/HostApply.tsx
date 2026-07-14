import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, getToken, apiError } from '../../api';
import { NavBar } from '../../components/ui';

export default function HostApply() {
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [category, setCategory] = useState('');
  const [city, setCity] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async () => {
    setErr(null); setLoading(true);
    try {
      if (!getToken()) { navigate('/login'); return; }
      await api.post('/host/apply', {
        phone_number: phone,
        bio: bio || null,
        category: category || null,
        city: city || null,
      });
      navigate('/host/dashboard');
    } catch (e: any) {
      setErr(apiError(e, 'Could not submit your application. Try again.'));
    } finally { setLoading(false); }
  };

  return (
    <>
      <NavBar />
      <div className="page">
        <div className="container-narrow">
          <button className="btn btn-subtle btn-sm" style={{ marginBottom: 16 }} onClick={() => navigate('/host/onboarding')}>← Back</button>
          <div className="eyebrow">host onboarding · step 2 of 2</div>
          <h1 className="display-2" style={{ marginTop: 6, marginBottom: 8 }}>
            apply to <span className="text-coral">host.</span>
          </h1>
          <p className="text-muted" style={{ marginBottom: 24 }}>
            Tell us who you are. Our team reviews every application, usually within a day, and we'll let you know as soon as you're approved.
          </p>

          <div className="card shadow">
            <div className="field">
              <label>Phone number</label>
              <input type="tel" placeholder="+91 98XXX XXXXX" value={phone} onChange={e => setPhone(e.target.value)} />
              <p className="text-muted" style={{ fontSize: 11, marginTop: 4 }}>Used only for account contact — never shown to guests.</p>
            </div>
            <div className="field">
              <label>Bio · what should guests know?</label>
              <textarea
                placeholder="Home cook for 12 years. South Indian comfort food. I host suppers in my garden."
                value={bio} onChange={e => setBio(e.target.value)} rows={5}
              />
            </div>
            <div className="field">
              <label>What do you host?</label>
              <select value={category} onChange={e => setCategory(e.target.value)}>
                <option value="">Pick a category</option>
                <option value="music">Music</option>
                <option value="tech">Technology</option>
                <option value="lifestyle">Lifestyle</option>
                <option value="business">Business</option>
                <option value="food">Food</option>
                <option value="outdoor">Outdoor</option>
              </select>
            </div>
            <div className="field">
              <label>City hub</label>
              <input type="text" placeholder="e.g. Bengaluru, Indiranagar" value={city} onChange={e => setCity(e.target.value)} />
            </div>

            {err && <div className="pill pill-error" style={{ marginBottom: 12 }}>{err}</div>}
            <button className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: 12 }} onClick={handleSubmit} disabled={phone.length < 5 || loading}>
              {loading ? 'Submitting…' : 'Submit application →'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

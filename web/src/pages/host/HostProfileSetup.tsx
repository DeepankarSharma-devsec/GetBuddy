import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, getToken, apiError } from '../../api';
import { NavBar } from '../../components/ui';

// Item 4: guided bio builder — four prompts compose one great bio.
const PROMPTS = [
  { key: 'intro', label: 'Who are you?', ph: 'Home cook for 12 years, engineer by day.' },
  { key: 'offer', label: 'What do you host / offer?', ph: 'Slow South Indian suppers in my garden, 6 seats max.' },
  { key: 'languages', label: 'Languages you speak', ph: 'English, Kannada, a bit of Tamil.' },
  { key: 'expect', label: 'What should guests expect?', ph: 'Good food, no rush, everyone leaves with a recipe.' },
] as const;
type PromptKey = typeof PROMPTS[number]['key'];

const composeBio = (p: Record<PromptKey, string>) =>
  [p.intro, p.offer, p.languages && `Languages: ${p.languages}`, p.expect]
    .filter(Boolean).join('\n\n');

export default function HostProfileSetup() {
  const [freeMode, setFreeMode] = useState(false);
  const [parts, setParts] = useState<Record<PromptKey, string>>({ intro: '', offer: '', languages: '', expect: '' });
  const [bio, setBio] = useState('');
  const [city, setCity] = useState('');
  const [category, setCategory] = useState('');
  const [instagram, setInstagram] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [website, setWebsite] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Prefill so "edit host profile" doesn't wipe what's already there
  useEffect(() => {
    if (!getToken()) { navigate('/login'); return; }
    api.get('/host/me/profile').then(r => {
      const d = r.data;
      if (d.bio) { setBio(d.bio); setFreeMode(true); }
      setCity(d.city || ''); setCategory(d.category || '');
      setInstagram(d.instagram || ''); setLinkedin(d.linkedin || ''); setWebsite(d.website || '');
    }).catch(() => {});
  }, [navigate]);

  const setPart = (k: PromptKey, v: string) => setParts(p => ({ ...p, [k]: v }));
  const finalBio = freeMode ? bio : composeBio(parts);

  const handleFinish = async () => {
    setErr(null); setLoading(true);
    try {
      await api.put('/host/me/profile', {
        bio: finalBio || null,
        city: city || null,
        category: category || null,
        instagram: instagram || null,
        linkedin: linkedin || null,
        website: website || null,
      });
      navigate('/host/dashboard');
    } catch (e: any) {
      setErr(apiError(e, 'Could not save your profile. Try again.'));
    } finally { setLoading(false); }
  };

  return (
    <>
      <NavBar />
      <div className="page">
        <div className="container-narrow">
          <div className="eyebrow">host onboarding · step 3 of 3</div>
          <h1 className="display-2" style={{ marginTop: 6, marginBottom: 8 }}>
            tell people who <span className="text-coral">you are.</span>
          </h1>
          <p className="text-muted" style={{ marginBottom: 24 }}>This shows on your public host profile — guests read it before they book you.</p>

          <div className="card shadow" style={{ marginBottom: 16 }}>
            <div className="row between" style={{ marginBottom: 12 }}>
              <div className="section-h" style={{ margin: 0 }}>your bio</div>
              <button className="btn btn-subtle btn-sm" onClick={() => {
                if (!freeMode) setBio(finalBio);  // carry the built bio into free editing
                setFreeMode(!freeMode);
              }}>
                {freeMode ? '← Use guided prompts' : 'Write freely instead'}
              </button>
            </div>

            {freeMode ? (
              <div className="field">
                <label>Bio · what should guests know?</label>
                <textarea value={bio} onChange={e => setBio(e.target.value)} rows={6}
                  placeholder="Home cook for 12 years. South Indian comfort food. I host suppers in my garden." />
              </div>
            ) : (
              <>
                {PROMPTS.map(p => (
                  <div className="field" key={p.key}>
                    <label>{p.label}</label>
                    <input value={parts[p.key]} onChange={e => setPart(p.key, e.target.value)} placeholder={p.ph} />
                  </div>
                ))}
                {finalBio && (
                  <div className="card-soft" style={{ background: 'var(--bg)' }}>
                    <div className="section-h">preview — how guests will see it</div>
                    <p style={{ whiteSpace: 'pre-wrap', fontSize: 14, lineHeight: 1.7 }}>{finalBio}</p>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="card shadow" style={{ marginBottom: 16 }}>
            <div className="section-h">basics</div>
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
          </div>

          <div className="card shadow" style={{ marginBottom: 16 }}>
            <div className="section-h">social links · optional, shown on your profile</div>
            <div className="input-row">
              <div className="field">
                <label>Instagram</label>
                <input placeholder="@yourhandle" value={instagram} onChange={e => setInstagram(e.target.value)} />
              </div>
              <div className="field">
                <label>LinkedIn</label>
                <input placeholder="linkedin.com/in/you" value={linkedin} onChange={e => setLinkedin(e.target.value)} />
              </div>
            </div>
            <div className="field" style={{ marginBottom: 4 }}>
              <label>Website</label>
              <input placeholder="yoursite.com" value={website} onChange={e => setWebsite(e.target.value)} />
            </div>
          </div>

          {err && <div className="pill pill-error" style={{ marginBottom: 12 }}>{err}</div>}
          <button className="btn btn-primary btn-lg" style={{ width: '100%' }} onClick={handleFinish} disabled={loading}>
            {loading ? 'Saving…' : 'Save profile →'}
          </button>
        </div>
      </div>
    </>
  );
}

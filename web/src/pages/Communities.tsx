import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, getToken, apiError, isHost } from '../api';
import { NavBar, Spinner, Empty, ImageInput } from '../components/ui';

interface Community {
  id: number; name: string; description?: string | null; city?: string | null;
  cover_image?: string | null; is_owner: boolean; member_count: number; invite_code?: string | null;
}

export default function Communities() {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [joinCode, setJoinCode] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [city, setCity] = useState('');
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const navigate = useNavigate();

  const load = async () => {
    try { setCommunities((await api.get('/communities/mine')).data); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (!getToken()) { navigate('/login'); return; }
    load();
  }, [navigate]);

  const join = async () => {
    if (!joinCode.trim()) return;
    setErr(null); setBusy(true);
    try {
      const r = await api.post('/communities/join', { invite_code: joinCode.trim() });
      setJoinCode('');
      await load();
      navigate(`/communities/${r.data.id}`);
    } catch (e) { setErr(apiError(e, 'Could not join with that code.')); }
    finally { setBusy(false); }
  };

  const create = async () => {
    setErr(null); setBusy(true);
    try {
      const r = await api.post('/communities', { name, description: description || null, city: city || null, cover_image: coverImage });
      setShowCreate(false); setName(''); setDescription(''); setCity(''); setCoverImage(null);
      await load();
      navigate(`/communities/${r.data.id}`);
    } catch (e) { setErr(apiError(e, 'Could not create the community.')); }
    finally { setBusy(false); }
  };

  return (
    <>
      <NavBar />
      <div className="page">
        <div className="container" style={{ maxWidth: 900 }}>
          <span className="ticket-badge">our usp · run your own crowd</span>
          <h1 className="display-2 vintage-head" style={{ marginTop: 10, marginBottom: 8 }}>
            communities.
          </h1>
          <p className="text-muted" style={{ maxWidth: 560, marginBottom: 28, lineHeight: 1.6 }}>
            A private space for any crowd you manage — an apartment society, a PG, a running club, a college batch.
            Split it into interest circles (food, rent, sports…), post members-only events, and keep everything off the public feed.
          </p>

          {/* join */}
          <div className="card shadow" style={{ marginBottom: 20 }}>
            <div className="section-h">have an invite code?</div>
            <div className="row gap-8" style={{ flexWrap: 'wrap' }}>
              <input value={joinCode} onChange={e => setJoinCode(e.target.value)} placeholder="e.g. 3fa9b21c"
                onKeyDown={e => e.key === 'Enter' && join()}
                style={{ border: '1.5px solid var(--ink)', borderRadius: 'var(--r-sm)', padding: '10px 14px', flex: 1, minWidth: 180, outline: 'none' }} />
              <button className="btn btn-primary" onClick={join} disabled={busy || !joinCode.trim()}>Join →</button>
            </div>
          </div>

          {/* create — hosts only, matches the backend rule */}
          {isHost() && (
            <div className="card shadow" style={{ marginBottom: 28 }}>
              <div className="row between">
                <div className="section-h" style={{ margin: 0 }}>run your own community</div>
                <button className="btn btn-subtle btn-sm" onClick={() => setShowCreate(!showCreate)}>{showCreate ? '× Close' : '+ New community'}</button>
              </div>
              {showCreate && (
                <div style={{ marginTop: 14 }}>
                  <div className="field">
                    <label>Name</label>
                    <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Sunrise Apartments, Koramangala" />
                  </div>
                  <div className="field">
                    <label>What's it for?</label>
                    <textarea rows={3} value={description} onChange={e => setDescription(e.target.value)} placeholder="Residents-only events, food orders, PG & rent leads, weekend plans." />
                  </div>
                  <div className="field">
                    <label>City</label>
                    <input value={city} onChange={e => setCity(e.target.value)} placeholder="Bengaluru" />
                  </div>
                  <div className="field">
                    <label>Cover photo</label>
                    <ImageInput value={coverImage} onChange={setCoverImage} label="add a cover" height={120} />
                  </div>
                  <button className="btn btn-primary" onClick={create} disabled={busy || !name.trim()}>{busy ? '…' : 'Create community →'}</button>
                </div>
              )}
            </div>
          )}

          {err && <div className="pill pill-error" style={{ marginBottom: 16 }}>{err}</div>}

          <div className="section-h">your communities</div>
          {loading ? <Spinner /> : communities.length === 0 ? (
            <Empty title="No communities yet" hint={isHost() ? 'Create one above, or join with an invite code.' : 'Join with an invite code — or become a host to run your own.'} />
          ) : (
            <div className="grid grid-2">
              {communities.map(c => (
                <article key={c.id} className="card card-clickable shadow" onClick={() => navigate(`/communities/${c.id}`)} style={{ padding: 0, overflow: 'hidden' }}>
                  {c.cover_image && <img src={c.cover_image} alt="" style={{ width: '100%', height: 110, objectFit: 'cover', display: 'block' }} />}
                  <div style={{ padding: 16 }}>
                    <div className="row gap-8" style={{ marginBottom: 8 }}>
                      {c.is_owner && <span className="pill pill-ink">you run this</span>}
                      {c.city && <span className="pill">{c.city}</span>}
                      <span className="pill pill-mint">{c.member_count} member{c.member_count === 1 ? '' : 's'}</span>
                    </div>
                    <h3 className="h3" style={{ marginBottom: 6 }}>{c.name}</h3>
                    {c.description && <p className="text-muted" style={{ fontSize: 13, lineHeight: 1.5 }}>{c.description}</p>}
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

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, getToken, apiError } from '../api';
import { NavBar, Avatar, Spinner, Empty, colorForId } from '../components/ui';
import { ListingCard } from './Explore';

interface Detail {
  id: number; name: string; description?: string | null; city?: string | null;
  cover_image?: string | null; is_owner: boolean; member_count: number; invite_code?: string | null;
  owner_name: string;
  subgroups: { id: number; name: string; interest?: string | null }[];
  members: { id: number; name: string; photo?: string | null; joined_at: string }[];
  events: any[];
}

const INTERESTS = ['food', 'rent', 'pg', 'sports', 'travel', 'music', 'gaming', 'other'];

export default function CommunityDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [c, setC] = useState<Detail | null>(null);
  const [blocked, setBlocked] = useState(false);
  const [activeSub, setActiveSub] = useState<number | 'all'>('all');
  const [showAddSub, setShowAddSub] = useState(false);
  const [subName, setSubName] = useState('');
  const [subInterest, setSubInterest] = useState('other');
  const [copied, setCopied] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = () => api.get(`/communities/${id}`).then(r => setC(r.data)).catch(() => setBlocked(true));

  useEffect(() => {
    if (!getToken()) { navigate('/login'); return; }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, navigate]);

  const addSub = async () => {
    setErr(null);
    try {
      await api.post(`/communities/${id}/subgroups`, { name: subName, interest: subInterest });
      setSubName(''); setShowAddSub(false);
      await load();
    } catch (e) { setErr(apiError(e, 'Could not add the circle.')); }
  };

  const copyInvite = () => {
    if (!c?.invite_code) return;
    navigator.clipboard?.writeText(c.invite_code).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); });
  };

  if (blocked) return (<><NavBar /><div className="page container"><Empty title="Members only" hint="Ask the community owner for an invite code, then join from the Communities page." /></div></>);
  if (!c) return (<><NavBar /><div className="page container"><Spinner /></div></>);

  return (
    <>
      <NavBar />
      <div className="page">
        <div className="container" style={{ maxWidth: 960 }}>
          <button className="btn btn-subtle btn-sm" style={{ marginBottom: 16 }} onClick={() => navigate('/communities')}>← All communities</button>

          <div className="card shadow" style={{ marginBottom: 24, padding: 0, overflow: 'hidden' }}>
            {c.cover_image && <img src={c.cover_image} alt="" style={{ width: '100%', height: 160, objectFit: 'cover', display: 'block' }} />}
            <div style={{ padding: 20 }}>
              <div className="row gap-8" style={{ marginBottom: 10, flexWrap: 'wrap' }}>
                {c.is_owner && <span className="pill pill-ink">you run this</span>}
                {c.city && <span className="pill">{c.city}</span>}
                <span className="pill pill-mint">{c.member_count} member{c.member_count === 1 ? '' : 's'}</span>
                <span className="pill">run by {c.owner_name}</span>
              </div>
              <h1 className="h2" style={{ marginBottom: 6 }}>{c.name}</h1>
              {c.description && <p className="text-muted" style={{ fontSize: 14, lineHeight: 1.6, maxWidth: 620 }}>{c.description}</p>}
              {c.is_owner && c.invite_code && (
                <div className="row gap-8" style={{ marginTop: 14, flexWrap: 'wrap' }}>
                  <span className="ticket-badge">invite code · {c.invite_code}</span>
                  <button className="btn btn-subtle btn-sm" onClick={copyInvite}>{copied ? 'Copied ✓' : 'Copy code'}</button>
                  <button className="btn btn-primary btn-sm" onClick={() => navigate('/host/create')}>+ Members-only listing</button>
                </div>
              )}
            </div>
          </div>

          {/* sub-groups (item 14) */}
          <div className="row between" style={{ marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
            <div className="section-h" style={{ margin: 0 }}>circles — find your people inside</div>
            {c.is_owner && <button className="btn btn-subtle btn-sm" onClick={() => setShowAddSub(!showAddSub)}>{showAddSub ? '× Close' : '+ New circle'}</button>}
          </div>
          {showAddSub && (
            <div className="card-soft row gap-8" style={{ marginBottom: 12, flexWrap: 'wrap' }}>
              <input value={subName} onChange={e => setSubName(e.target.value)} placeholder="e.g. Midnight food orders"
                style={{ border: '1.5px solid var(--ink)', borderRadius: 'var(--r-sm)', padding: '8px 12px', flex: 1, minWidth: 180, outline: 'none' }} />
              <select value={subInterest} onChange={e => setSubInterest(e.target.value)}
                style={{ border: '1.5px solid var(--ink)', borderRadius: 'var(--r-sm)', padding: '8px 12px' }}>
                {INTERESTS.map(i => <option key={i} value={i}>{i}</option>)}
              </select>
              <button className="btn btn-primary btn-sm" onClick={addSub} disabled={!subName.trim()}>Add</button>
            </div>
          )}
          {err && <div className="pill pill-error" style={{ marginBottom: 12 }}>{err}</div>}
          <div className="row gap-8" style={{ flexWrap: 'wrap', marginBottom: 28 }}>
            <button className={`chip ${activeSub === 'all' ? 'active' : ''}`} onClick={() => setActiveSub('all')}>Everyone</button>
            {c.subgroups.map(s => (
              <button key={s.id} className={`chip ${activeSub === s.id ? 'active' : ''}`} onClick={() => setActiveSub(s.id)}>
                {s.name}{s.interest ? ` · ${s.interest}` : ''}
              </button>
            ))}
            {c.subgroups.length === 0 && <span className="text-muted" style={{ fontSize: 12 }}>No circles yet{c.is_owner ? ' — add one for food, rent, PG, sports…' : ''}</span>}
          </div>

          {/* community events — a circle chip narrows to its interest */}
          {(() => {
            const interest = c.subgroups.find(s => s.id === activeSub)?.interest;
            const shown = interest ? c.events.filter(ev => ev.category === interest) : c.events;
            return (
              <>
                <div className="section-h">members-only events{interest ? ` · ${interest}` : ''}</div>
                {shown.length === 0 ? (
                  <div className="card-soft text-muted" style={{ fontSize: 13, marginBottom: 28 }}>
                    Nothing here{interest ? ` for ${interest}` : ''}. {c.is_owner ? 'Publish a listing and pick this community as the audience.' : 'The owner hasn\'t posted anything yet.'}
                  </div>
                ) : (
                  <div className="grid grid-3" style={{ marginBottom: 28 }}>
                    {shown.map(ev => <ListingCard key={ev.id} ev={ev} onClick={() => navigate(`/listing/${ev.id}`)} />)}
                  </div>
                )}
              </>
            );
          })()}
          {/* members */}
          <div className="section-h">members</div>
          <div className="row gap-8" style={{ flexWrap: 'wrap' }}>
            {c.members.length === 0 ? (
              <span className="text-muted" style={{ fontSize: 13 }}>Just you so far — share the invite code to get people in.</span>
            ) : c.members.map(m => (
              <span key={m.id} className="row gap-6 card-soft" style={{ padding: '6px 12px 6px 6px' }}>
                <Avatar name={m.name} size={28} color={colorForId(m.id)} src={m.photo} />
                <span style={{ fontSize: 13, fontWeight: 600 }}>{m.name}</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

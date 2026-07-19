import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, clearToken, getToken, setIsHost } from '../api';
import { NavBar, Avatar, Spinner, countryName, fileToDataUrl } from '../components/ui';
import { useRef } from 'react';

interface User { id: number; email: string; full_name: string; is_host: boolean; is_admin?: boolean; host_status?: string | null; country?: string; city: string | null; profile_photo?: string | null; deletion_requested?: boolean; }

export default function UserProfile() {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      if (!getToken()) { navigate('/login'); return; }
      try {
        const r = await api.get('/users/me');
        setUser(r.data);
        setIsHost(!!r.data.is_host);  // keeps the navbar's become-host CTA honest
      } catch (e) { console.error(e); navigate('/login'); }
    })();
  }, [navigate]);

  const handleLogout = () => { clearToken(); navigate('/login'); };

  const photoRef = useRef<HTMLInputElement>(null);
  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const dataUrl = await fileToDataUrl(file, 400);
      const r = await api.put('/users/me', { profile_photo: dataUrl });
      setUser(r.data);
    } catch (err) { console.error(err); }
  };

  // DPDPA right of access: download everything we hold as JSON
  const handleExport = async () => {
    const r = await api.get('/users/me/export');
    const url = URL.createObjectURL(new Blob([JSON.stringify(r.data, null, 2)], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url; a.download = 'getbuddygo-my-data.json'; a.click();
    URL.revokeObjectURL(url);
  };

  // DPDPA right of erasure — request goes to admin review, erasure is manual
  const handleDelete = async () => {
    if (!window.confirm('Request account deletion? Our team will review and erase your personal data. You can cancel the request until then.')) return;
    await api.delete('/users/me');
    setUser({ ...user!, deletion_requested: true });
  };
  const handleCancelDelete = async () => {
    await api.delete('/users/me/deletion-request');
    setUser({ ...user!, deletion_requested: false });
  };

  if (!user) return (<><NavBar /><div className="page container"><Spinner /></div></>);

  return (
    <>
      <NavBar />
      <div className="page">
        <div className="container" style={{ maxWidth: 720 }}>
          <div className="eyebrow">your account</div>
          <h1 className="display-2" style={{ marginTop: 6, marginBottom: 24 }}>profile</h1>

          <div className="card shadow row gap-20" style={{ marginBottom: 20 }}>
            <div style={{ position: 'relative' }}>
              <input ref={photoRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhoto} />
              <button onClick={() => photoRef.current?.click()} title="Change photo"
                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
                <Avatar name={user.full_name} size={72} color="#FFD84D" src={user.profile_photo} />
                <span className="pill" style={{ position: 'absolute', bottom: -4, right: -8, fontSize: 9 }}>edit</span>
              </button>
            </div>
            <div className="grow">
              <h2 className="h2" style={{ marginBottom: 4 }}>{user.full_name}</h2>
              <div className="text-muted" style={{ fontSize: 14 }}>{user.email}</div>
              <div className="text-muted mono" style={{ fontSize: 11, marginTop: 4 }}>
                {user.city || 'CITY NOT SET'}{user.country ? ` · ${countryName(user.country).toUpperCase()}` : ''}{user.is_host ? ' · HOST' : ''}{user.is_admin ? ' · ADMIN' : ''}
              </div>
            </div>
            {/* Admins are platform staff — no host/guest actions */}
            {user.is_admin ? null : user.is_host ? (
              <button className="btn btn-primary" onClick={() => navigate('/host/dashboard')}>Host dashboard →</button>
            ) : user.host_status === 'PENDING' ? (
              <button className="btn btn-subtle" onClick={() => navigate('/host/dashboard')}>Application under review</button>
            ) : (
              <button className="btn btn-accent" onClick={() => navigate('/host/onboarding')}>{user.host_status === 'REJECTED' ? 'Reapply to host' : 'Become a host'}</button>
            )}
          </div>

          <div className="grid grid-2" style={{ marginBottom: 20 }}>
            {user.is_admin ? (
              <ProfileTile label="Admin overview" hint="Platform metrics & moderation" onClick={() => navigate('/admin/dashboard')} />
            ) : (
              <>
                <ProfileTile label="My bookings" hint="Upcoming and past seats" onClick={() => navigate('/my-bookings')} />
                <ProfileTile label="Discover" hint="Find new experiences" onClick={() => navigate('/explore')} />
                {user.is_host && (
                  <ProfileTile label="Edit host profile" hint="Bio, category, city" onClick={() => navigate('/host/onboarding/profile')} />
                )}
              </>
            )}
          </div>

          <div className="row gap-8" style={{ flexWrap: 'wrap' }}>
            <button className="btn btn-subtle" style={{ color: 'var(--coral)', borderColor: 'var(--coral-soft)' }} onClick={handleLogout}>Log out</button>
            <button className="btn btn-subtle" onClick={handleExport}>Download my data</button>
            {!user.is_admin && (user.deletion_requested ? (
              <button className="btn btn-subtle" onClick={handleCancelDelete}>Deletion pending review — cancel request</button>
            ) : (
              <button className="btn btn-subtle" style={{ color: 'var(--coral)', borderColor: 'var(--coral-soft)' }} onClick={handleDelete}>Delete account</button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

function ProfileTile({ label, hint, onClick }: { label: string; hint: string; onClick: () => void }) {
  return (
    <button className="card-soft card-clickable" onClick={onClick}
      style={{ textAlign: 'left', cursor: 'pointer', background: 'var(--paper)', border: '1px solid var(--line)' }}>
      <div className="h3" style={{ fontSize: 16, marginBottom: 4 }}>{label}</div>
      <div className="text-muted" style={{ fontSize: 12 }}>{hint}</div>
    </button>
  );
}

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, clearToken, getToken } from '../api';
import { NavBar, Avatar, Spinner } from '../components/ui';

interface User { id: number; email: string; full_name: string; is_host: boolean; is_admin?: boolean; city: string | null; }

export default function UserProfile() {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      if (!getToken()) { navigate('/login'); return; }
      try {
        const r = await api.get('/users/me');
        setUser(r.data);
      } catch (e) { console.error(e); navigate('/login'); }
    })();
  }, [navigate]);

  const handleLogout = () => { clearToken(); navigate('/login'); };

  if (!user) return (<><NavBar /><div className="page container"><Spinner /></div></>);

  return (
    <>
      <NavBar />
      <div className="page">
        <div className="container" style={{ maxWidth: 720 }}>
          <div className="eyebrow">your account</div>
          <h1 className="display-2" style={{ marginTop: 6, marginBottom: 24 }}>profile</h1>

          <div className="card shadow row gap-20" style={{ marginBottom: 20 }}>
            <Avatar name={user.full_name} size={72} color="#FFD84D" />
            <div className="grow">
              <h2 className="h2" style={{ marginBottom: 4 }}>{user.full_name}</h2>
              <div className="text-muted" style={{ fontSize: 14 }}>{user.email}</div>
              <div className="text-muted mono" style={{ fontSize: 11, marginTop: 4 }}>
                {user.city || 'CITY NOT SET'}{user.is_host ? ' · HOST' : ''}{user.is_admin ? ' · ADMIN' : ''}
              </div>
            </div>
            {user.is_host ? (
              <button className="btn btn-primary" onClick={() => navigate('/host/dashboard')}>Host dashboard →</button>
            ) : (
              <button className="btn btn-accent" onClick={() => navigate('/host/onboarding')}>Become a host</button>
            )}
          </div>

          <div className="grid grid-2" style={{ marginBottom: 20 }}>
            <ProfileTile label="My bookings" hint="Upcoming and past seats" onClick={() => navigate('/my-bookings')} />
            <ProfileTile label="Discover" hint="Find new experiences" onClick={() => navigate('/explore')} />
            <ProfileTile label="Edit profile" hint="Name, photo, bio" onClick={() => {}} />
            <ProfileTile label="Settings" hint="Notifications, privacy" onClick={() => {}} />
            {user.is_admin && (
              <ProfileTile label="Admin overview" hint="Platform metrics & moderation" onClick={() => navigate('/admin/dashboard')} />
            )}
          </div>

          <button className="btn btn-subtle" style={{ color: 'var(--coral)', borderColor: 'var(--coral-soft)' }} onClick={handleLogout}>Log out</button>
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

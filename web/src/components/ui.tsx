import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { clearToken, getToken } from '../api';

export function Wordmark({ size = 22 }: { size?: number }) {
  return (
    <span className="gbg-wordmark" style={{ fontSize: size }}>
      <span className="dot" style={{ width: size * 1.25, height: size * 1.25 }}>
        <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
          <circle cx="13" cy="16" r="2.4" fill="#151515" />
          <circle cx="23" cy="16" r="2.4" fill="#151515" />
          <path d="M12 22.5c1.3 2.5 3.8 3.5 6 3.5s4.7-1 6-3.5" stroke="#151515" strokeWidth="2.3" strokeLinecap="round" fill="none" />
        </svg>
      </span>
      <span>getbuddy<span className="go">go</span><span className="arrow">→</span></span>
    </span>
  );
}

export function NavBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthed = !!getToken();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isHostRoute = location.pathname.startsWith('/host');

  const logout = () => { clearToken(); navigate('/login'); };

  return (
    <header className="gbg-nav">
      <div className="container gbg-nav-inner">
        <Link to="/" aria-label="GetBuddyGo home"><Wordmark /></Link>
        <nav className="row gap-4">
          {!isAdminRoute && !isHostRoute && (
            <>
              <Link className="navlink" to="/explore">Discover</Link>
              <Link className="navlink" to="/search">Search</Link>
              {isAuthed && <Link className="navlink" to="/my-bookings">My bookings</Link>}
              {isAuthed && <Link className="navlink" to="/profile">Profile</Link>}
              {!isAuthed && <Link className="navlink" to="/login">Log in</Link>}
              <Link className="btn btn-primary btn-sm" to="/host/onboarding">Become a host</Link>
            </>
          )}
          {isHostRoute && (
            <>
              <Link className="navlink" to="/host/dashboard">Dashboard</Link>
              <Link className="navlink" to="/host/bookings">Bookings</Link>
              <Link className="navlink" to="/host/calendar">Calendar</Link>
              <Link className="navlink" to="/host/earnings">Earnings</Link>
              <Link className="btn btn-primary btn-sm" to="/host/create">+ New listing</Link>
              <button className="navlink" onClick={logout}>Log out</button>
            </>
          )}
          {isAdminRoute && (
            <>
              <Link className="navlink" to="/admin/dashboard">Overview</Link>
              <Link className="navlink" to="/admin/users">Users</Link>
              <Link className="navlink" to="/admin/hosts">Hosts</Link>
              <Link className="navlink" to="/admin/listings">Listings</Link>
              <Link className="navlink" to="/admin/bookings">Bookings</Link>
              <Link className="navlink" to="/admin/transactions">Transactions</Link>
              <Link className="navlink" to="/admin/analytics">Analytics</Link>
              <button className="navlink" onClick={logout}>Log out</button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

export function Avatar({ name, color = '#FFD84D', size = 36 }: { name: string; color?: string; size?: number }) {
  const init = (name?.[0] || '?').toUpperCase();
  return (
    <span
      className="avatar"
      style={{ width: size, height: size, background: color, fontSize: size * 0.42 }}
    >
      {init}
    </span>
  );
}

export function Photo({ label, color = '#F1FBCB', height = 180, radius }: { label?: string; color?: string; height?: number | string; radius?: number }) {
  return (
    <div className="photo" style={{
      height,
      background: `linear-gradient(135deg, ${color} 0%, ${color} 60%, rgba(0,0,0,0.06) 100%)`,
      borderRadius: radius,
    }}>{label}</div>
  );
}

export function Stars({ value, size = 12 }: { value: number; size?: number }) {
  return (
    <span style={{ display: 'inline-flex', gap: 1, color: 'var(--ink)' }}>
      {[1,2,3,4,5].map(i => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24" fill="currentColor"
          style={{ opacity: i <= Math.round(value) ? 1 : 0.22 }}>
          <path d="M12 2l2.9 6.3 6.9.9-5.1 4.8 1.3 6.8L12 17.5 6 20.8l1.3-6.8L2.2 9.2l6.9-.9z"/>
        </svg>
      ))}
    </span>
  );
}

export function StatusPill({ status }: { status?: string }) {
  if (!status) return null;
  const s = status.toUpperCase();
  let cls = 'pill';
  if (['CONFIRMED', 'ACTIVE', 'PAID', 'VERIFIED'].includes(s)) cls = 'pill pill-mint';
  else if (['PENDING'].includes(s)) cls = 'pill pill-yellow';
  else if (['CANCELLED', 'BLOCKED', 'FAILED', 'REJECTED'].includes(s)) cls = 'pill pill-error';
  return <span className={cls}>{s}</span>;
}

export function Empty({ title, hint, action }: { title: string; hint?: string; action?: React.ReactNode }) {
  return (
    <div className="card-soft" style={{ textAlign: 'center', padding: '48px 24px' }}>
      <div className="h3" style={{ marginBottom: 6 }}>{title}</div>
      {hint && <div className="text-muted" style={{ marginBottom: 18 }}>{hint}</div>}
      {action}
    </div>
  );
}

export function Spinner() {
  return <div className="text-muted mono" style={{ padding: 32, textAlign: 'center' }}>loading…</div>;
}

const HOST_COLORS = ['#FF6A4D', '#6B5DE0', '#2B4CF0', '#D6F26B', '#FFD84D', '#C8F0D4', '#FF6A4D'];
export const colorForId = (n: number | string) => {
  const num = typeof n === 'number' ? n : (n + '').split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return HOST_COLORS[num % HOST_COLORS.length];
};

export const CATEGORY_COLORS: Record<string, string> = {
  music: '#E4E8FF',
  tech: '#C8F0D4',
  lifestyle: '#FFE3DB',
  business: '#FFF4C2',
  food: '#FF6A4D',
  outdoor: '#D6F26B',
  '1:1': '#FFD84D',
};

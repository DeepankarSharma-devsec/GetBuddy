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
  const changeCountry = (c: string) => { setCountry(c); window.location.reload(); };

  return (
    <header className="gbg-nav">
      <div className="container gbg-nav-inner">
        <Link to="/" aria-label="GetBuddyGo home"><Wordmark /></Link>
        <nav className="row gap-4">
          {!isAdminRoute && !isHostRoute && (
            <>
              <select
                aria-label="Country"
                value={getCountry()}
                onChange={e => changeCountry(e.target.value)}
                style={{
                  border: '1px solid var(--line2)', borderRadius: 999, padding: '6px 10px',
                  background: 'var(--paper)', fontWeight: 600, fontSize: 12, cursor: 'pointer',
                }}>
                {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name} · {c.symbol}</option>)}
              </select>
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

// Curated free-to-use images from Unsplash (Unsplash License — free for commercial
// use, no attribution required). Each entry maps a keyword (matched against the
// Photo `label` prop, case-insensitive substring) to a stable Unsplash photo ID.
const PHOTO_LIBRARY: { match: string; id: string }[] = [
  { match: 'dinner',     id: 'photo-1414235077428-338989a2e8c0' },
  { match: 'food',       id: 'photo-1504754524776-8f4f37790ca0' },
  { match: 'jam',        id: 'photo-1501386761578-eac5c94b800a' },
  { match: 'open mic',   id: 'photo-1470229722913-7c0e2dbbafd3' },
  { match: 'music',      id: 'photo-1511671782779-c97d3d27a1d4' },
  { match: 'trek',       id: 'photo-1551632811-561732d1e306' },
  { match: 'sunset',     id: 'photo-1506905925346-21bda4d32df4' },
  { match: 'outdoor',    id: 'photo-1464822759023-fed622ff2c3b' },
  { match: 'tech',       id: 'photo-1518770660439-4636190af475' },
  { match: 'gaming',     id: 'photo-1542751371-adc38448a05e' },
  { match: 'business',   id: 'photo-1556761175-5973dc0f32e7' },
  { match: 'mentor',     id: 'photo-1573497019940-1c28c88b4f3e' },
  { match: '1:1',        id: 'photo-1573497019940-1c28c88b4f3e' },
  { match: 'lifestyle',  id: 'photo-1529333166437-7750a6dd5a70' },
  { match: 'online',     id: 'photo-1588196749597-9ff075ee6b5b' },
  { match: 'group',      id: 'photo-1529156069898-49953e39b3ac' },
  { match: 'offline',    id: 'photo-1511795409834-ef04bbd61622' },
  // service (buddy) categories
  { match: 'movie',      id: 'photo-1489599849927-2ee91cede3ba' },
  { match: 'shopping',   id: 'photo-1441986300917-64674bd600d8' },
  { match: 'travel',     id: 'photo-1488646953014-85cb44e25828' },
  { match: 'fitness',    id: 'photo-1571019613454-1cb2f99b2d8b' },
  { match: 'hangout',    id: 'photo-1529333166437-7750a6dd5a70' },
  { match: 'clubbing',   id: 'photo-1470229722913-7c0e2dbbafd3' },
];
const FALLBACK_PHOTO = 'photo-1529156069898-49953e39b3ac'; // social gathering

function photoSrcFor(label?: string) {
  const l = (label || '').toLowerCase();
  const hit = PHOTO_LIBRARY.find(p => l.includes(p.match));
  const id = hit?.id || FALLBACK_PHOTO;
  return `https://images.unsplash.com/${id}?auto=format&fit=crop&w=900&q=70`;
}

export function Photo({ label, color = '#F1FBCB', height = 180, radius, src }: { label?: string; color?: string; height?: number | string; radius?: number; src?: string }) {
  const imgSrc = src || photoSrcFor(label);
  return (
    <div className="photo" style={{
      height,
      background: `linear-gradient(135deg, ${color} 0%, ${color} 60%, rgba(0,0,0,0.06) 100%)`,
      borderRadius: radius,
      position: 'relative',
      overflow: 'hidden',
    }}>
      <img
        src={imgSrc}
        alt={label || ''}
        loading="lazy"
        style={{
          position: 'absolute', inset: 0,
          width: '100%', height: '100%',
          objectFit: 'cover',
          borderRadius: radius,
          display: 'block',
        }}
        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
      />
      {label && (
        <span style={{
          position: 'absolute', left: 12, bottom: 10,
          background: 'rgba(21,21,21,0.78)', color: '#fff',
          padding: '4px 10px', borderRadius: 999,
          fontSize: 12, fontWeight: 600, letterSpacing: 0.2,
        }}>{label}</span>
      )}
    </div>
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
  else if (['PENDING', 'REQUESTED', 'PENDING_PAYMENT'].includes(s)) cls = 'pill pill-yellow';
  else if (['CANCELLED', 'BLOCKED', 'FAILED', 'REJECTED', 'DECLINED'].includes(s)) cls = 'pill pill-error';
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

// ---- countries & currencies ----
// Listings are priced in the host's local currency; guests browse by country.
export const COUNTRIES = [
  { code: 'IN', name: 'India', currency: 'INR', symbol: '₹' },
  { code: 'US', name: 'USA', currency: 'USD', symbol: '$' },
  { code: 'GB', name: 'UK', currency: 'GBP', symbol: '£' },
  { code: 'JP', name: 'Japan', currency: 'JPY', symbol: '¥' },
  { code: 'KR', name: 'Korea', currency: 'KRW', symbol: '₩' },
];
const CURRENCY_SYMBOL: Record<string, string> = { INR: '₹', USD: '$', GBP: '£', JPY: '¥', KRW: '₩' };
export const sym = (currency?: string) => CURRENCY_SYMBOL[currency || 'INR'] || '₹';
export const fmtMoney = (amount: number, currency?: string) => `${sym(currency)}${Math.round(amount).toLocaleString()}`;

export const getCountry = () => localStorage.getItem('country') || 'IN';
export const setCountry = (c: string) => localStorage.setItem('country', c);
export const countryName = (code: string) => COUNTRIES.find(c => c.code === code)?.name || code;

// Per-hour pricing helpers — an event runs for a fixed duration, so we show
// total cost + length up front and keep the hourly rate as the breakdown.
export function durationLabel(minutes?: number) {
  const m = minutes || 60;
  if (m < 60) return `${m} min`;
  const h = m / 60;
  return `${Number.isInteger(h) ? h : h.toFixed(1)} hr${h > 1 ? 's' : ''}`;
}
export function totalPrice(price: number, minutes?: number) {
  return Math.round(price * (minutes || 60) / 60);
}

export const CATEGORY_COLORS: Record<string, string> = {
  music: '#E4E8FF',
  tech: '#C8F0D4',
  lifestyle: '#FFE3DB',
  business: '#FFF4C2',
  food: '#FF6A4D',
  outdoor: '#D6F26B',
  '1:1': '#FFD84D',
  // service (buddy) categories
  movie: '#E4E8FF',
  shopping: '#FFE3DB',
  travel: '#C8F0D4',
  fitness: '#D6F26B',
  hangout: '#FFF4C2',
  clubbing: '#FFD84D',
};

export const SERVICE_CATEGORIES = [
  { id: 'hangout',  label: 'Hangout' },
  { id: 'movie',    label: 'Movie Partner' },
  { id: 'shopping', label: 'Shopping Buddy' },
  { id: 'travel',   label: 'Travel Partner' },
  { id: 'clubbing', label: 'Clubbing' },
  { id: 'fitness',  label: 'Fitness Buddy' },
];

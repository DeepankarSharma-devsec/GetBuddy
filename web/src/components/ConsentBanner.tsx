import { useState } from 'react';
import { Link } from 'react-router-dom';

// ponytail: we only use functional storage (login token), no tracking cookies —
// so one "okay" button is honest. Add an "essential only" split if analytics ever lands.
const KEY = 'gbg_consent';

export default function ConsentBanner() {
  const [accepted, setAccepted] = useState(() => localStorage.getItem(KEY) === '1');
  if (accepted) return null;

  return (
    <div style={{
      position: 'fixed', bottom: 16, left: 16, right: 16, zIndex: 1000,
      maxWidth: 560, margin: '0 auto',
      background: 'var(--paper)', border: '1.5px solid var(--ink)',
      boxShadow: '4px 4px 0 var(--ink)', borderRadius: 12, padding: '18px 20px',
    }}>
      <div style={{ fontWeight: 700, marginBottom: 6 }}>
        🍪 cookies. the boring kind, sorry.
      </div>
      <p style={{ fontSize: 13, lineHeight: 1.6, marginBottom: 12 }}>
        We use a little browser storage to keep you logged in — that's it. No ad trackers,
        no selling your data, no cookie that follows you around the internet like a clingy ex.
        By continuing you're okay with that, plus our{' '}
        <Link to="/privacy" style={{ textDecoration: 'underline' }}>privacy policy</Link> and{' '}
        <Link to="/terms" style={{ textDecoration: 'underline' }}>terms</Link>.
      </p>
      <button
        className="btn btn-primary"
        onClick={() => { localStorage.setItem(KEY, '1'); setAccepted(true); }}
      >
        okay, crumbs accepted
      </button>
    </div>
  );
}

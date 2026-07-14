import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { API_BASE, setToken, setIsAdmin, apiError } from '../api';
import { Wordmark, COUNTRIES, getCountry, setCountry } from '../components/ui';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [country, setCountryField] = useState(getCountry());
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null); setOk(null);
    setLoading(true);
    try {
      if (isRegister) {
        await axios.post(`${API_BASE}/register`, { email, password, full_name: name, country });
        setCountry(country);
        setIsRegister(false);
        setOk('Account created. Log in to continue.');
      } else {
        const formData = new URLSearchParams();
        formData.append('username', email);
        formData.append('password', password);
        const response = await axios.post(`${API_BASE}/login`, formData, {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        });
        setToken(response.data.access_token);
        setIsAdmin(!!response.data.is_admin);
        // Browse in the user's home country by default
        try {
          const me = await axios.get(`${API_BASE}/users/me`, { headers: { Authorization: `Bearer ${response.data.access_token}` } });
          if (me.data?.country) setCountry(me.data.country);
        } catch {}
        // Admins land in the admin portal, not the guest catalog
        navigate(response.data.is_admin ? '/admin/dashboard' : '/explore');
      }
    } catch (error: any) {
      setErr(apiError(error, 'Action failed. Try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="split-half" style={{ minHeight: '100vh' }}>
      <div className="hero" style={{ borderRadius: 0, border: 'none', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 48 }}>
        <Link to="/"><Wordmark /></Link>
        <div>
          <div className="eyebrow" style={{ marginBottom: 16 }}>welcome back</div>
          <h1 className="display-1" style={{ fontSize: 56 }}>
            buddies, <span className="text-cobalt">events</span>,<br/>good <span className="text-coral">days</span>.
          </h1>
          <p className="text-muted" style={{ marginTop: 18, maxWidth: 420, fontSize: 16 }}>
            Discover small-group experiences hosted by humans you'd actually want to spend an evening with. 18+, all ages welcome.
          </p>
        </div>
        <div className="mono text-muted" style={{ fontSize: 11, letterSpacing: 1.2 }}>PAY PER HOUR · NO MEMBERSHIP FEE · VERIFIED HOSTS</div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 48, background: 'var(--bg)' }}>
        <div className="card shadow" style={{ maxWidth: 420, width: '100%' }}>
          <div className="eyebrow" style={{ marginBottom: 8 }}>{isRegister ? 'create account' : 'sign in'}</div>
          <h2 className="h2" style={{ marginBottom: 24 }}>
            {isRegister ? 'Join GetBuddyGo' : 'Welcome back'}
          </h2>
          <form onSubmit={handleSubmit}>
            {isRegister && (
              <>
                <div className="field">
                  <label>Full name</label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)} required />
                </div>
                <div className="field">
                  <label>Country</label>
                  <select value={country} onChange={e => setCountryField(e.target.value)}>
                    {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name} ({c.currency})</option>)}
                  </select>
                </div>
              </>
            )}
            <div className="field">
              <label>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div className="field">
              <label>Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            {ok && <div className="pill pill-mint" style={{ marginBottom: 12 }}>{ok}</div>}
            {err && <div className="pill pill-error" style={{ marginBottom: 12 }}>{err}</div>}
            <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
              {loading ? '…' : isRegister ? 'Create account →' : 'Log in →'}
            </button>
          </form>
          <p style={{ textAlign: 'center', marginTop: 18, fontSize: 13 }}>
            {isRegister ? 'Already have an account? ' : 'New to GetBuddyGo? '}
            <span style={{ color: 'var(--cobalt)', cursor: 'pointer', fontWeight: 600 }} onClick={() => { setIsRegister(!isRegister); setErr(null); setOk(null); }}>
              {isRegister ? 'Log in' : 'Sign up'}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

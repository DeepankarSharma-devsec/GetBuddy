import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { NavBar } from '../../components/ui';

export default function HostProfileSetup() {
  const [bio, setBio] = useState('');
  const [city, setCity] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleFinish = async () => {
    setLoading(true);
    try {
      // MVP: accept and route. Future: PUT /users/me or POST /host/profile.
      navigate('/host/dashboard');
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
          <p className="text-muted" style={{ marginBottom: 24 }}>This shows on your public host profile.</p>

          <div className="card shadow">
            <div className="row gap-16" style={{ marginBottom: 24 }}>
              <div style={{
                width: 96, height: 96, borderRadius: '50%',
                background: 'var(--lime-soft)', border: '2px dashed var(--ink)',
                display: 'grid', placeItems: 'center', cursor: 'pointer',
              }}>
                <span style={{ fontSize: 28 }}>+</span>
              </div>
              <div>
                <div className="h3" style={{ fontSize: 16 }}>Profile photo</div>
                <div className="text-muted" style={{ fontSize: 12 }}>Hosts with a real photo get 2.4× more bookings.</div>
              </div>
            </div>

            <div className="field">
              <label>Bio · what should guests know?</label>
              <textarea
                placeholder="Home cook for 12 years. South Indian comfort food. I host suppers in my garden."
                value={bio} onChange={e => setBio(e.target.value)} rows={5}
              />
            </div>
            <div className="field">
              <label>City hub</label>
              <input type="text" placeholder="e.g. Bengaluru, Indiranagar" value={city} onChange={e => setCity(e.target.value)} />
            </div>

            <button className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: 12 }} onClick={handleFinish} disabled={loading}>
              {loading ? '…' : 'Complete onboarding →'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

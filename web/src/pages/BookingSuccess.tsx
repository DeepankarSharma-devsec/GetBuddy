import { useParams, useNavigate } from 'react-router-dom';
import { NavBar } from '../components/ui';

export default function BookingSuccess() {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <>
      <NavBar />
      <div className="page">
        <div className="container-narrow" style={{ textAlign: 'center', paddingTop: 32 }}>
          <div style={{
            width: 96, height: 96, borderRadius: '50%',
            background: 'var(--lime)', border: 'var(--border-card)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 24px',
          }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
              <path d="M5 12.5l4 4 10-10" stroke="#151515" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="eyebrow">booking confirmed</div>
          <h1 className="display-1" style={{ fontSize: 56, marginTop: 8 }}>
            you're <span className="text-coral">in.</span>
          </h1>
          <p className="text-muted" style={{ fontSize: 16, marginTop: 14, marginBottom: 32 }}>
            Booking #{id} is locked in. Confirmation just landed in your inbox.
          </p>

          <div className="card shadow" style={{ textAlign: 'left', marginBottom: 28 }}>
            <div className="section-h">what happens next</div>
            <ul className="stack gap-12" style={{ listStyle: 'none', padding: 0, fontSize: 14 }}>
              <li className="row gap-12"><span className="pill pill-mint">1</span> Confirmation email is on its way.</li>
              <li className="row gap-12"><span className="pill pill-mint">2</span> Online events: link unmasks 15 min before.</li>
              <li className="row gap-12"><span className="pill pill-mint">3</span> Offline: full address now in My Bookings.</li>
              <li className="row gap-12"><span className="pill pill-mint">4</span> Free cancel up to 24h before.</li>
            </ul>
          </div>

          <div className="row gap-12" style={{ justifyContent: 'center' }}>
            <button className="btn btn-ghost btn-lg" onClick={() => navigate('/explore')}>Explore more</button>
            <button className="btn btn-primary btn-lg" onClick={() => navigate('/my-bookings')}>View my bookings →</button>
          </div>
        </div>
      </div>
    </>
  );
}

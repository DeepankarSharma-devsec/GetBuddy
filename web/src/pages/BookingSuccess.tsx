import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { NavBar } from '../components/ui';

export default function BookingSuccess() {
  const { id } = useParams();
  const navigate = useNavigate();
  const params = new URLSearchParams(useLocation().search);
  const requested = params.get('requested') === '1';
  const paid = params.get('paid') === '1';

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
          <div className="eyebrow">{requested ? 'request sent' : 'booking confirmed'}</div>
          <h1 className="display-1" style={{ fontSize: 56, marginTop: 8 }}>
            {requested ? <>request <span className="text-cobalt">sent.</span></> : <>you're <span className="text-coral">in.</span></>}
          </h1>
          <p className="text-muted" style={{ fontSize: 16, marginTop: 14, marginBottom: 32 }}>
            {requested
              ? 'Your buddy has been notified and will accept or decline soon.'
              : paid
                ? 'Payment received — your seat is confirmed. It may take a few seconds to show as PAID in My Bookings.'
                : `Booking #${id} is locked in. Your seat is confirmed.`}
          </p>

          <div className="card shadow" style={{ textAlign: 'left', marginBottom: 28 }}>
            <div className="section-h">what happens next</div>
            <ul className="stack gap-12" style={{ listStyle: 'none', padding: 0, fontSize: 14 }}>
              {requested ? (
                <>
                  <li className="row gap-12"><span className="pill pill-mint">1</span> Your buddy accepts or declines — usually within a few hours.</li>
                  <li className="row gap-12"><span className="pill pill-mint">2</span> Once accepted, payment is taken and the meeting details unlock.</li>
                  <li className="row gap-12"><span className="pill pill-mint">3</span> Track the status anytime in My Bookings.</li>
                </>
              ) : (
                <>
                  <li className="row gap-12"><span className="pill pill-mint">1</span> Online events: join link is now in My Bookings.</li>
                  <li className="row gap-12"><span className="pill pill-mint">2</span> Offline: full address is now in My Bookings.</li>
                  <li className="row gap-12"><span className="pill pill-mint">3</span> Free cancel up to 24h before.</li>
                </>
              )}
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

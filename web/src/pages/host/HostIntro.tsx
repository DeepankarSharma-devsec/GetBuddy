import { useNavigate } from 'react-router-dom';
import { NavBar } from '../../components/ui';

export default function HostIntro() {
  const navigate = useNavigate();
  return (
    <>
      <NavBar />
      <div className="page">
        <div className="container" style={{ maxWidth: 920 }}>
          <div className="hero" style={{ marginBottom: 32 }}>
            <div className="row gap-8" style={{ marginBottom: 14 }}>
              <span className="pill pill-ink">host onboarding · step 1 of 2</span>
            </div>
            <h1 className="display-1" style={{ fontSize: 48 }}>
              monetize your <span className="text-cobalt">buddy energy.</span>
            </h1>
            <p style={{ marginTop: 14, fontSize: 16, maxWidth: 600 }}>
              You bring the vibe, we bring the seats. Set your own hourly rate and earn from every booking — <strong>no membership fee, ever</strong>. Every host is reviewed by our team before going live, so guests know they're in good hands.
            </p>
          </div>

          <div className="grid grid-3" style={{ marginBottom: 32 }}>
            <Tile title="Set your terms" body="Pick the day, the place, the cap. 1:1, group, online, offline — your call." color="#F1FBCB" />
            <Tile title="Earn per hour" body="Set your own hourly rate. Direct UPI payout into your bank, zero joining fees." color="#E4E8FF" />
            <Tile title="Admin reviewed" body="Our team reviews every application to keep the community safe and trusted." color="#FFE3DB" />
          </div>

          <div className="card shadow row between" style={{ flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div className="eyebrow">takes about 2 minutes</div>
              <h3 className="h3" style={{ marginTop: 4 }}>Tell us about yourself → we review → you start hosting.</h3>
            </div>
            <button className="btn btn-primary btn-lg" onClick={() => navigate('/host/onboarding/apply')}>Apply to host →</button>
          </div>
        </div>
      </div>
    </>
  );
}

function Tile({ title, body, color }: { title: string; body: string; color: string }) {
  return (
    <div className="card shadow" style={{ background: color }}>
      <h3 className="h3">{title}</h3>
      <p style={{ marginTop: 8, fontSize: 14, lineHeight: 1.6 }}>{body}</p>
    </div>
  );
}

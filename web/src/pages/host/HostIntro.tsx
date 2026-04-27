import { useNavigate } from 'react-router-dom';
import { NavBar, Photo } from '../../components/ui';

export default function HostIntro() {
  const navigate = useNavigate();
  return (
    <>
      <NavBar />
      <div className="page">
        <div className="container" style={{ maxWidth: 920 }}>
          <div className="hero" style={{ marginBottom: 32 }}>
            <div className="row gap-8" style={{ marginBottom: 14 }}>
              <span className="pill pill-ink">host onboarding · step 1 of 3</span>
            </div>
            <h1 className="display-1" style={{ fontSize: 48 }}>
              monetize your <span className="text-cobalt">buddy energy.</span>
            </h1>
            <p style={{ marginTop: 14, fontSize: 16, maxWidth: 600 }}>
              You bring the vibe, we bring the seats. Host curated experiences and keep <strong>85%</strong> of every booking. Phone-verified profiles, secure UPI payouts, dedicated support.
            </p>
          </div>

          <div className="grid grid-3" style={{ marginBottom: 32 }}>
            <Tile title="Set your terms" body="Pick the day, the place, the cap. 1:1, group, online, offline — your call." color="#F1FBCB" />
            <Tile title="Earn 85%" body="Direct UPI payout into your bank. Weekly cycle. Zero hidden fees." color="#E4E8FF" />
            <Tile title="Stay protected" body="ID verified guests, ratings on both sides, GetBuddyGo Trust & Safety." color="#FFE3DB" />
          </div>

          <div className="card shadow row between" style={{ flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div className="eyebrow">ready in 3 minutes</div>
              <h3 className="h3" style={{ marginTop: 4 }}>Verify phone → set up profile → publish your first listing.</h3>
            </div>
            <button className="btn btn-primary btn-lg" onClick={() => navigate('/host/onboarding/phone')}>Start verification →</button>
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

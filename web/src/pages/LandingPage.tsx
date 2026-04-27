import { useNavigate, Link } from 'react-router-dom';
import { NavBar, Photo } from '../components/ui';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <>
      <NavBar />
      <div className="page">
        <div className="container">
          <section className="hero" style={{ marginBottom: 56 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 32, alignItems: 'center' }}>
              <div>
                <div className="row gap-8" style={{ marginBottom: 16 }}>
                  <span className="pill pill-ink"><span className="dot live" /> live in bengaluru</span>
                  <span className="pill">18+ · all ages welcome</span>
                </div>
                <h1 className="display-1">
                  social is a <span className="text-cobalt">skill.</span><br/>
                  someone is <span className="text-coral">selling</span> it.
                </h1>
                <p style={{ marginTop: 18, fontSize: 17, maxWidth: 520, lineHeight: 1.55 }}>
                  GetBuddyGo is a marketplace for hosted experiences — slow dinners, sunset treks, jam nights, gaming couches, storytelling walks. Hosted by humans you'd actually want around.
                </p>
                <div className="row gap-12" style={{ marginTop: 28 }}>
                  <button className="btn btn-primary btn-lg" onClick={() => navigate('/explore')}>Discover →</button>
                  <button className="btn btn-ghost btn-lg" onClick={() => navigate('/host/onboarding')}>Become a host</button>
                </div>
                <div className="row gap-24" style={{ marginTop: 40 }}>
                  <Stat n="248" label="hosts vetted" />
                  <Stat n="1.4k" label="experiences hosted" />
                  <Stat n="4.92" label="avg rating" />
                </div>
              </div>
              <div className="stack gap-12">
                <div className="card shadow" style={{ padding: 0, overflow: 'hidden' }}>
                  <Photo label="long slow dinner" color="#FF6A4D" height={170} radius={0} />
                  <div style={{ padding: 14 }}>
                    <div className="eyebrow">tonight · 7:30pm</div>
                    <div className="h3" style={{ marginTop: 4 }}>South Indian supper, plated slow</div>
                    <div className="text-muted mono" style={{ fontSize: 11, marginTop: 6 }}>aarav · indiranagar · 2 seats left</div>
                  </div>
                </div>
                <div className="row gap-12">
                  <div className="card shadow grow" style={{ padding: 0, overflow: 'hidden' }}>
                    <Photo label="sunset trek" color="#D6F26B" height={120} radius={0} />
                    <div style={{ padding: 12 }}>
                      <div className="h3" style={{ fontSize: 16 }}>Nandi Hills ridge</div>
                      <div className="text-muted mono" style={{ fontSize: 10, marginTop: 4 }}>sona · sat · ₹1400</div>
                    </div>
                  </div>
                  <div className="card shadow grow" style={{ padding: 0, overflow: 'hidden' }}>
                    <Photo label="open mic" color="#E4E8FF" height={120} radius={0} />
                    <div style={{ padding: 12 }}>
                      <div className="h3" style={{ fontSize: 16 }}>Jazz jam · KMG</div>
                      <div className="text-muted mono" style={{ fontSize: 10, marginTop: 4 }}>dev · fri · ₹900</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section style={{ marginBottom: 56 }}>
            <div className="eyebrow">how it works</div>
            <h2 className="display-2" style={{ marginTop: 6, marginBottom: 28 }}>three steps. zero awkward.</h2>
            <div className="grid grid-3">
              <Step n="01" title="Find a vibe" body="Browse experiences by category, time, or mood. Filter by budget and group size. Save what calls you." color="var(--lime-soft)" />
              <Step n="02" title="Book a seat" body="UPI checkout in seconds. Cancel free up to 24h before. Address shared once you're confirmed." color="var(--cobalt-soft)" />
              <Step n="03" title="Show up" body="Hosts greet at the door. Small groups, real conversations. Rate, tip, come back." color="var(--coral-soft)" />
            </div>
          </section>

          <section className="card shadow" style={{ background: 'var(--ink)', color: 'var(--lime)', padding: 48, marginBottom: 32 }}>
            <div className="row between" style={{ flexWrap: 'wrap', gap: 24 }}>
              <div style={{ maxWidth: 520 }}>
                <div className="eyebrow" style={{ color: 'rgba(214,242,107,0.7)' }}>for hosts</div>
                <h2 className="display-2" style={{ color: 'var(--lime)', marginTop: 8 }}>monetize the way you<br/>already make people feel.</h2>
                <p style={{ color: 'rgba(214,242,107,0.85)', marginTop: 14 }}>15% platform fee, 85% to you. Phone-verified profiles. Calendar, payouts, KYC — all in one place.</p>
              </div>
              <Link className="btn btn-accent btn-lg" to="/host/onboarding">Start hosting →</Link>
            </div>
          </section>

          <footer className="row between text-muted mono" style={{ fontSize: 11, padding: '20px 0', borderTop: '1px solid var(--line)' }}>
            <span>© 2026 GetBuddyGo · made in bengaluru</span>
            <span>privacy · terms · 18+ only</span>
          </footer>
        </div>
      </div>
    </>
  );
}

function Stat({ n, label }: { n: string; label: string }) {
  return (
    <div>
      <div className="display-2" style={{ fontSize: 32 }}>{n}</div>
      <div className="text-muted mono" style={{ fontSize: 11, letterSpacing: 1, textTransform: 'uppercase' }}>{label}</div>
    </div>
  );
}

function Step({ n, title, body, color }: { n: string; title: string; body: string; color: string }) {
  return (
    <div className="card shadow" style={{ background: color }}>
      <div className="mono" style={{ fontSize: 11, letterSpacing: 1.5, color: 'var(--ink)' }}>{n}</div>
      <h3 className="h3" style={{ marginTop: 8, marginBottom: 8 }}>{title}</h3>
      <p style={{ fontSize: 14, lineHeight: 1.6 }}>{body}</p>
    </div>
  );
}

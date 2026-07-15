import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../api';
import { NavBar, Photo, Wordmark, colorForId, CATEGORY_COLORS, SERVICE_CATEGORIES, COUNTRIES, durationLabel, totalPrice, getCountry, countryName, sym } from '../components/ui';

interface Event { id: number; title: string; price: number; currency?: string; event_type: string; mode: string; start_time: string; category?: string; duration_minutes?: number; }

const CATEGORIES = [
  { id: 'music',     label: 'Music',     hint: 'jam nights · open mics · listening rooms' },
  { id: 'food',      label: 'Food',      hint: 'slow dinners · supper clubs · chai crawls' },
  { id: 'outdoor',   label: 'Outdoor',   hint: 'sunrise treks · cycle loops · park hangs' },
  { id: 'tech',      label: 'Tech',      hint: 'hack nights · demo days · co-working' },
  { id: 'lifestyle', label: 'Lifestyle', hint: 'mixology · book circles · game couches' },
  { id: 'business',  label: 'Business',  hint: 'mentorship · founder circles · career 1:1s' },
];

const FAQS = [
  { q: 'What is GetBuddyGo?', a: 'A marketplace for hosted experiences — dinners, treks, jam nights, 1:1 sessions — run by verified hosts. You browse, book a seat, and show up. Live in India, USA, UK, Japan, and Korea.' },
  { q: 'How does the pricing work?', a: 'Every listing shows a clear hourly rate in the host\'s local currency. Your total is simply the rate × the session length — a 200/hr session that runs 2 hours costs 400. No membership fee, no subscription, no hidden charges.' },
  { q: 'Is it safe?', a: 'Every host is phone-verified before they can publish a listing. Exact addresses and meeting links are shared only after your booking is confirmed, and both guests and hosts are accountable to each other.' },
  { q: 'How do I become a host?', a: 'Three steps: verify your phone, set up your profile, publish your first listing. It takes about 3 minutes and costs nothing to join — you set your own hourly rate and schedule.' },
  { q: 'Can I cancel a booking?', a: 'Yes — cancellation is free up to 24 hours before the experience. After that, 50% is refunded if you cancel at least 6 hours before the start.' },
  { q: 'Which cities are you in?', a: 'We are live in Bengaluru for offline experiences, and online sessions are open to everyone, everywhere.' },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const localSymbol = COUNTRIES.find(c => c.code === getCountry())?.symbol || '₹';

  useEffect(() => {
    api.get(`/events?country=${getCountry()}`).then(r => setEvents(r.data.slice(0, 6))).catch(() => {});
  }, []);

  return (
    <>
      <NavBar />
      <div className="page">
        <div className="container">

          {/* HERO */}
          <section className="hero" style={{ marginBottom: 72 }}>
            <div className="split-2" style={{ alignItems: 'center' }}>
              <div>
                <div className="row gap-8" style={{ marginBottom: 16 }}>
                  <span className="pill pill-ink"><span className="dot live" /> live in {countryName(getCountry()).toLowerCase()} + 4 more</span>
                  <span className="pill">18+ · all ages welcome</span>
                </div>
                <h1 className="display-1">
                  social is a <span className="text-cobalt">skill.</span><br/>
                  someone is <span className="text-coral">selling</span> it.
                </h1>
                <p style={{ marginTop: 18, fontSize: 17, maxWidth: 520, lineHeight: 1.55 }}>
                  GetBuddyGo is a marketplace for hosted experiences — slow dinners, sunset treks, jam nights, gaming couches, storytelling walks. Pay by the hour, only for what you book. No memberships, no subscriptions.
                </p>
                <div className="row gap-12" style={{ marginTop: 28 }}>
                  <button className="btn btn-primary btn-lg" onClick={() => navigate('/explore')}>Discover →</button>
                  <button className="btn btn-ghost btn-lg" onClick={() => navigate('/host/onboarding')}>Become a host</button>
                </div>
                <div className="row gap-24" style={{ marginTop: 40 }}>
                  <Stat n={`${localSymbol}0`} label="membership fee" />
                  <Stat n="per hour" label="honest pricing" />
                  <Stat n="100%" label="hosts phone-verified" />
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
                      <div className="text-muted mono" style={{ fontSize: 10, marginTop: 4 }}>sona · sat · {localSymbol}700/hr</div>
                    </div>
                  </div>
                  <div className="card shadow grow" style={{ padding: 0, overflow: 'hidden' }}>
                    <Photo label="open mic" color="#E4E8FF" height={120} radius={0} />
                    <div style={{ padding: 12 }}>
                      <div className="h3" style={{ fontSize: 16 }}>Jazz jam · KMG</div>
                      <div className="text-muted mono" style={{ fontSize: 10, marginTop: 4 }}>dev · fri · {localSymbol}450/hr</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* CATEGORIES */}
          <section style={{ marginBottom: 72 }}>
            <div className="eyebrow">browse by vibe</div>
            <div className="row between" style={{ flexWrap: 'wrap', gap: 16, marginBottom: 28 }}>
              <h2 className="display-2" style={{ marginTop: 6 }}>whatever your evening needs.</h2>
              <Link to="/explore" className="btn btn-ghost">See everything →</Link>
            </div>
            <div className="grid grid-3">
              {CATEGORIES.map(c => (
                <article key={c.id} className="card card-clickable shadow" onClick={() => navigate(`/explore?category=${c.id}`)}
                  style={{ padding: 0, overflow: 'hidden' }}>
                  <Photo label={c.label} color={CATEGORY_COLORS[c.id] || '#F1FBCB'} height={140} radius={0} />
                  <div style={{ padding: '12px 16px 16px' }}>
                    <h3 className="h3" style={{ fontSize: 18 }}>{c.label}</h3>
                    <div className="text-muted mono" style={{ fontSize: 11, marginTop: 4 }}>{c.hint}</div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          {/* LIVE LISTINGS */}
          {events.length > 0 && (
            <section style={{ marginBottom: 72 }}>
              <div className="eyebrow">on the calendar now</div>
              <div className="row between" style={{ flexWrap: 'wrap', gap: 16, marginBottom: 28 }}>
                <h2 className="display-2" style={{ marginTop: 6 }}>booking <span className="text-coral">right now.</span></h2>
                <Link to="/explore" className="btn btn-ghost">Browse all →</Link>
              </div>
              <div className="grid grid-3">
                {events.map(ev => (
                  <article key={ev.id} className="card card-clickable shadow" onClick={() => navigate(`/listing/${ev.id}`)}
                    style={{ padding: 0, overflow: 'hidden' }}>
                    <Photo label={ev.category || ev.event_type} color={CATEGORY_COLORS[ev.category || ''] || colorForId(ev.id)} height={150} radius={0} />
                    <div style={{ padding: '12px 16px 16px' }}>
                      <div className="row gap-8" style={{ marginBottom: 8, flexWrap: 'wrap' }}>
                        <span className="pill pill-cobalt">{ev.event_type}</span>
                        <span className="pill pill-mint">{ev.mode}</span>
                      </div>
                      <h3 className="h3" style={{ fontSize: 17, lineHeight: 1.25, marginBottom: 8 }}>{ev.title}</h3>
                      <div className="text-muted mono" style={{ fontSize: 11, marginBottom: 10 }}>
                        {new Date(ev.start_time).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })} · {durationLabel(ev.duration_minutes)}
                      </div>
                      <div className="row between" style={{ alignItems: 'flex-end' }}>
                        <div>
                          <span className="h3" style={{ fontSize: 18 }}>{sym(ev.currency)}{totalPrice(ev.price, ev.duration_minutes).toLocaleString()}</span>
                          <div className="text-muted mono" style={{ fontSize: 10, marginTop: 2 }}>{sym(ev.currency)}{Math.round(ev.price).toLocaleString()}/hr · {durationLabel(ev.duration_minutes)}</div>
                        </div>
                        <span className="btn btn-ghost btn-sm">Book →</span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          {/* BUDDY SERVICES */}
          <section style={{ marginBottom: 72 }}>
            <div className="eyebrow">buddies · by the hour</div>
            <div className="row between" style={{ flexWrap: 'wrap', gap: 16, marginBottom: 28 }}>
              <h2 className="display-2" style={{ marginTop: 6 }}>need a <span className="text-cobalt">plus-one?</span></h2>
              <Link to="/explore?kind=SERVICE" className="btn btn-ghost">Browse buddies →</Link>
            </div>
            <p className="text-muted" style={{ maxWidth: 560, marginTop: -16, marginBottom: 28, lineHeight: 1.6 }}>
              Not an event — a person. Book a verified buddy by the hour for whatever your plans need: you pick the date, time, and hours; they accept, you meet.
            </p>
            <div className="grid grid-3">
              {SERVICE_CATEGORIES.map(c => (
                <article key={c.id} className="card card-clickable shadow" onClick={() => navigate(`/explore?kind=SERVICE&category=${c.id}`)}
                  style={{ padding: 0, overflow: 'hidden' }}>
                  <Photo label={c.label} color={CATEGORY_COLORS[c.id] || '#F1FBCB'} height={120} radius={0} />
                  <div style={{ padding: '12px 16px 16px' }}>
                    <div className="row between" style={{ alignItems: 'center' }}>
                      <h3 className="h3" style={{ fontSize: 17 }}>{c.label}</h3>
                      <span className="btn btn-ghost btn-sm">Find one →</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          {/* HOW IT WORKS */}
          <section style={{ marginBottom: 72 }}>
            <div className="eyebrow">how it works</div>
            <h2 className="display-2" style={{ marginTop: 6, marginBottom: 28 }}>three steps. zero awkward.</h2>
            <div className="grid grid-3">
              <Step n="01" title="Find a vibe" body="Browse experiences by category, time, or mood. Every listing shows a clear hourly rate — no hidden fees, no membership wall." color="var(--lime-soft)" />
              <Step n="02" title="Book a seat" body="Pay only for the hours you book. Cancel free up to 24h before. Address shared once you're confirmed." color="var(--cobalt-soft)" />
              <Step n="03" title="Show up" body="Hosts greet at the door. Small groups, real conversations. Rate, tip, come back." color="var(--coral-soft)" />
            </div>
          </section>

          {/* WHY US */}
          <section style={{ marginBottom: 72 }}>
            <div className="eyebrow">why getbuddygo</div>
            <h2 className="display-2" style={{ marginTop: 6, marginBottom: 28 }}>built on <span className="text-cobalt">trust</span>, priced by the <span className="text-coral">hour</span>.</h2>
            <div className="grid grid-4">
              <Trust icon={<ShieldIcon />} title="Verified hosts" body="Every host is phone-verified before their first listing goes live." />
              <Trust icon={<ClockIcon />} title="Per-hour pricing" body="One hourly rate × session length. That's the whole formula." />
              <Trust icon={<PinIcon />} title="Private addresses" body="Exact locations and join links unlock only after you book." />
              <Trust icon={<UndoIcon />} title="Free cancellation" body="Change of plans? Cancel free up to 24 hours before." />
            </div>
          </section>

          {/* HOST CTA */}
          <section className="card shadow" style={{ background: 'var(--ink)', color: 'var(--lime)', padding: 48, marginBottom: 72 }}>
            <div className="row between" style={{ flexWrap: 'wrap', gap: 24 }}>
              <div style={{ maxWidth: 520 }}>
                <div className="eyebrow" style={{ color: 'rgba(214,242,107,0.7)' }}>for hosts</div>
                <h2 className="display-2" style={{ color: 'var(--lime)', marginTop: 8 }}>set your hourly rate.<br/>get paid to host.</h2>
                <p style={{ color: 'rgba(214,242,107,0.85)', marginTop: 14 }}>No membership fee — ever. Earn on your own schedule with phone-verified profiles, listings, bookings, and earnings in one dashboard.</p>
              </div>
              <Link className="btn btn-accent btn-lg" to="/host/onboarding">Start hosting →</Link>
            </div>
          </section>

          {/* FAQ */}
          <section style={{ marginBottom: 72, maxWidth: 800 }}>
            <div className="eyebrow">faq</div>
            <h2 className="display-2" style={{ marginTop: 6, marginBottom: 28 }}>questions, answered.</h2>
            <div className="stack gap-12">
              {FAQS.map(f => (
                <details key={f.q} className="faq">
                  <summary>{f.q}</summary>
                  <p>{f.a}</p>
                </details>
              ))}
            </div>
          </section>

          {/* FOOTER */}
          <footer style={{ borderTop: '1.5px solid var(--ink)', paddingTop: 40 }}>
            <div className="grid grid-3" style={{ gap: 32, marginBottom: 32 }}>
              <div>
                <Wordmark size={18} />
                <p className="text-muted" style={{ fontSize: 13, marginTop: 12, maxWidth: 280, lineHeight: 1.6 }}>
                  Hosted experiences, priced by the hour. Made in Bengaluru for people who'd rather be out than online.
                </p>
              </div>
              <div>
                <div className="section-h">explore</div>
                <div className="stack gap-8" style={{ fontSize: 13 }}>
                  <Link to="/explore">Discover experiences</Link>
                  <Link to="/search">Search & filter</Link>
                  <Link to="/my-bookings">My bookings</Link>
                </div>
              </div>
              <div>
                <div className="section-h">hosting</div>
                <div className="stack gap-8" style={{ fontSize: 13 }}>
                  <Link to="/host/onboarding">Become a host</Link>
                  <Link to="/host/dashboard">Host dashboard</Link>
                  <Link to="/host/create">Publish a listing</Link>
                </div>
              </div>
            </div>
            <div className="row between text-muted mono" style={{ fontSize: 11, padding: '20px 0', borderTop: '1px solid var(--line)', flexWrap: 'wrap', gap: 8 }}>
              <span>© 2026 GetBuddyGo · made in bengaluru</span>
              <span><Link to="/privacy">privacy</Link> · <Link to="/terms">terms</Link> · 18+ only</span>
            </div>
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

function Trust({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="card shadow">
      <div style={{
        width: 44, height: 44, borderRadius: 12, background: 'var(--lime)',
        border: '1.5px solid var(--ink)', display: 'grid', placeItems: 'center', marginBottom: 14,
      }}>
        {icon}
      </div>
      <h3 className="h3" style={{ fontSize: 17, marginBottom: 6 }}>{title}</h3>
      <p className="text-muted" style={{ fontSize: 13, lineHeight: 1.6 }}>{body}</p>
    </div>
  );
}

const iconProps = { width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none', stroke: '#151515', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

function ShieldIcon() {
  return <svg {...iconProps}><path d="M12 3l7 3v5c0 4.6-3 8.6-7 10-4-1.4-7-5.4-7-10V6l7-3z"/><path d="M9 12l2 2 4-4"/></svg>;
}
function ClockIcon() {
  return <svg {...iconProps}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>;
}
function PinIcon() {
  return <svg {...iconProps}><path d="M12 21s-6-5.2-6-10a6 6 0 1 1 12 0c0 4.8-6 10-6 10z"/><circle cx="12" cy="11" r="2.2"/></svg>;
}
function UndoIcon() {
  return <svg {...iconProps}><path d="M4 10h10a5 5 0 0 1 0 10H8"/><path d="M8 6l-4 4 4 4"/></svg>;
}

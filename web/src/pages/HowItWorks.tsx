import { Link } from 'react-router-dom';
import { NavBar } from '../components/ui';

// Item 2: the beginner's route map — two tracks, each step links into the app.
const GUEST_STEPS = [
  { n: '01', title: 'Create your account', body: 'Sign up with your email and country — takes under a minute.', to: '/login', cta: 'Sign up' },
  { n: '02', title: 'Pick your city', body: 'Choose any city — your own, or one you\'re visiting. The home feed shows every event and buddy there.', to: '/explore', cta: 'Open explore' },
  { n: '03', title: 'Events or buddies?', body: '🎟 Events are one-off happenings with a date and seats. 🤝 Buddies are people you book by the hour for movies, shopping, gym, anything.', to: '/search', cta: 'Search & filter' },
  { n: '04', title: 'Book or request', body: 'Events: book a seat and pay. Buddies: pick your date, time & hours — they accept, then you pay.', to: '/explore', cta: 'Find something' },
  { n: '05', title: 'Show up & enjoy', body: 'The address or meeting link unlocks once you\'re confirmed. Afterwards, leave a review.', to: '/my-bookings', cta: 'My bookings' },
];

const HOST_STEPS = [
  { n: '01', title: 'Apply to host', body: 'Share your phone number and a short application. Any city, town, or country — no location restrictions.', to: '/host/onboarding', cta: 'Become a host' },
  { n: '02', title: 'Get approved', body: 'Our team reviews applications, usually within a day. You\'ll get a notification the moment you\'re in.', to: '/profile', cta: 'Check status' },
  { n: '03', title: 'Build your profile', body: 'Guided prompts help you write a great bio. Add a photo and your social links — guests see this before booking.', to: '/host/onboarding/profile', cta: 'Set up profile' },
  { n: '04', title: 'Publish your first listing', body: 'Example listings sit right next to the form so you can see how others did it. You can edit for 1 hour after publishing.', to: '/host/create', cta: 'Create listing' },
  { n: '05', title: 'Accept requests, get paid', body: 'Accept or decline booking requests, track earnings, and manage payouts from your dashboard.', to: '/host/dashboard', cta: 'Host studio' },
];

function Track({ title, accent, steps }: { title: string; accent: string; steps: typeof GUEST_STEPS }) {
  return (
    <div>
      <h2 className="h2" style={{ marginBottom: 16, color: accent }}>{title}</h2>
      <div className="stack gap-12">
        {steps.map((s, i) => (
          <div key={s.n} className="card shadow" style={{ position: 'relative' }}>
            <div className="row gap-12" style={{ alignItems: 'flex-start' }}>
              <span className="mono" style={{
                fontSize: 12, fontWeight: 700, background: accent, color: '#fff',
                borderRadius: '50%', width: 32, height: 32, display: 'grid', placeItems: 'center', flexShrink: 0,
              }}>{s.n}</span>
              <div className="grow">
                <h3 className="h3" style={{ fontSize: 17, marginBottom: 4 }}>{s.title}</h3>
                <p className="text-muted" style={{ fontSize: 13, lineHeight: 1.6, marginBottom: 10 }}>{s.body}</p>
                <Link to={s.to} className="btn btn-subtle btn-sm">{s.cta} →</Link>
              </div>
            </div>
            {i < steps.length - 1 && (
              <div style={{ position: 'absolute', left: 31, bottom: -13, width: 2, height: 13, background: 'var(--line2)' }} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function HowItWorks() {
  return (
    <>
      <NavBar />
      <div className="page">
        <div className="container" style={{ maxWidth: 1000 }}>
          <span className="ticket-badge" style={{ marginBottom: 12 }}>the route map</span>
          <h1 className="display-2 vintage-head" style={{ marginTop: 10, marginBottom: 10 }}>
            new here? this is <em className="text-coral">the whole game.</em>
          </h1>
          <p className="text-muted" style={{ maxWidth: 560, marginBottom: 36, lineHeight: 1.6 }}>
            GetBuddyGo has two sides: find things to do (and people to do them with), or host and earn.
            Pick your track — every step links straight to where it happens.
          </p>
          <div className="grid grid-2" style={{ gap: 32, alignItems: 'start' }}>
            <Track title="🧭 I want to explore" accent="var(--accent-buddy)" steps={GUEST_STEPS} />
            <Track title="🏠 I want to host" accent="var(--accent-event)" steps={HOST_STEPS} />
          </div>
        </div>
      </div>
    </>
  );
}

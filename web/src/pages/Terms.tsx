import { Link } from 'react-router-dom';
import { NavBar } from '../components/ui';

// ponytail: static legal copy, same pattern as PrivacyPolicy. Lawyer-review before launch.
const EFFECTIVE_DATE = '15 July 2026';

function S({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 28 }}>
      <h2 className="display-2" style={{ fontSize: 22, marginBottom: 10 }}>{title}</h2>
      <div className="stack gap-8" style={{ fontSize: 15, lineHeight: 1.7 }}>{children}</div>
    </section>
  );
}

export default function Terms() {
  return (
    <>
      <NavBar />
      <div className="page">
        <div className="container" style={{ maxWidth: 760 }}>
          <div className="hero" style={{ marginBottom: 32 }}>
            <span className="pill pill-ink">terms</span>
            <h1 className="display-1" style={{ fontSize: 44, marginTop: 14 }}>Terms of Service</h1>
            <p className="text-muted" style={{ marginTop: 10, fontSize: 14 }}>
              Effective {EFFECTIVE_DATE}. By using GetBuddyGo you agree to these terms.
            </p>
          </div>

          <S title="The service">
            <p>
              GetBuddyGo is a marketplace connecting guests with independent hosts who offer hourly
              experiences and services, in person and online. We facilitate discovery, booking and
              payment. Hosts are not our employees; the experience itself is a contract between you
              and the host.
            </p>
          </S>

          <S title="Eligibility (18+)">
            <p>
              You must be at least 18 years old to create an account or use GetBuddyGo. By registering
              you confirm you are 18 or older. We may suspend accounts we believe belong to minors.
            </p>
          </S>

          <S title="Accounts">
            <p>
              Keep your credentials confidential; you are responsible for activity on your account.
              Provide accurate information and keep it current. One account per person.
            </p>
          </S>

          <S title="Bookings & payments">
            <ul style={{ paddingLeft: 20, lineHeight: 1.8 }}>
              <li>Prices are set by hosts, per hour, in the listing's currency.</li>
              <li>A payment-processing fee is shown at checkout and added to the listed price.</li>
              <li>Payments are processed by Stripe. A booking is confirmed only when the host accepts and payment succeeds.</li>
              <li>The exact meeting location for in-person experiences is shared after confirmation and payment.</li>
            </ul>
          </S>

          <S title="Cancellations & refunds">
            <ul style={{ paddingLeft: 20, lineHeight: 1.8 }}>
              <li><strong>Host declines or cancels:</strong> full refund of everything you paid, including the payment-processing fee.</li>
              <li><strong>You cancel 24+ hours before start:</strong> full refund of the booking amount; the payment-processing fee is not refundable.</li>
              <li><strong>You cancel within 24 hours of start, or don't show up:</strong> no refund.</li>
              <li><strong>We cancel a booking</strong> (e.g. a listing is removed for a terms violation): full refund, including the fee.</li>
            </ul>
            <p>
              Refunds go back to your original payment method, typically within 5–10 business days
              depending on your bank. To cancel, use your booking page or contact support.
            </p>
          </S>

          <S title="Hosting">
            <ul style={{ paddingLeft: 20, lineHeight: 1.8 }}>
              <li>Host applications are reviewed by our team before going live.</li>
              <li>We deduct a platform commission from each booking; the current rate is shown in your host dashboard. Payouts go to your registered account.</li>
              <li>You are responsible for the legality, safety and quality of your experiences, and for your own tax obligations.</li>
            </ul>
          </S>

          <S title="Conduct">
            <p>
              No harassment, discrimination, illegal activity, or misrepresentation. No taking
              transactions off-platform to avoid fees. We may remove listings or suspend accounts
              that violate these terms or put users at risk.
            </p>
          </S>

          <S title="Liability">
            <p>
              We provide the platform "as is". To the maximum extent permitted by law, GetBuddyGo is
              not liable for the conduct of hosts or guests, or for indirect or consequential losses.
              Our total liability for any claim is limited to the amount you paid us for the booking
              giving rise to it. Nothing here limits liability that cannot be limited under Indian law.
            </p>
          </S>

          <S title="Privacy">
            <p>
              How we handle your personal data is described in our <Link to="/privacy">Privacy Policy</Link>,
              which complies with the Digital Personal Data Protection Act, 2023.
            </p>
          </S>

          <S title="Governing law & changes">
            <p>
              These terms are governed by the laws of India; courts in Bengaluru have jurisdiction.
              We may update these terms and will post the new effective date here; continued use
              means acceptance.
            </p>
          </S>
        </div>
      </div>
    </>
  );
}

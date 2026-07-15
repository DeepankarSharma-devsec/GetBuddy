import { NavBar } from '../components/ui';

// ponytail: static legal copy. Update GRIEVANCE_* + effective date before launch;
// swap to a CMS only if legal wants to edit without a deploy.
const EFFECTIVE_DATE = '15 July 2026';
const GRIEVANCE_NAME = '[Grievance Officer name]';
const GRIEVANCE_EMAIL = 'privacy@getbuddygo.com';

function S({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 28 }}>
      <h2 className="display-2" style={{ fontSize: 22, marginBottom: 10 }}>{title}</h2>
      <div className="stack gap-8" style={{ fontSize: 15, lineHeight: 1.7 }}>{children}</div>
    </section>
  );
}

export default function PrivacyPolicy() {
  return (
    <>
      <NavBar />
      <div className="page">
        <div className="container" style={{ maxWidth: 760 }}>
          <div className="hero" style={{ marginBottom: 32 }}>
            <span className="pill pill-ink">privacy</span>
            <h1 className="display-1" style={{ fontSize: 44, marginTop: 14 }}>Privacy Policy</h1>
            <p className="text-muted" style={{ marginTop: 10, fontSize: 14 }}>
              Effective {EFFECTIVE_DATE}. This notice explains how GetBuddyGo collects, uses and protects
              your personal data, in line with India's Digital Personal Data Protection Act, 2023 (DPDPA).
            </p>
          </div>

          <S title="Who we are">
            <p>
              GetBuddyGo ("we", "us") operates a platform that connects guests with hosts offering
              in-person and online experiences. For the personal data described here, we act as the
              Data Fiduciary under the DPDPA. Hosts you book with are independent Data Fiduciaries for
              data you share directly with them.
            </p>
          </S>

          <S title="What we collect">
            <ul style={{ paddingLeft: 20, lineHeight: 1.8 }}>
              <li><strong>Account data:</strong> name, email, password (stored hashed), country and city.</li>
              <li><strong>Profile data:</strong> optional profile photo; for hosts, phone number, bio, expertise and category.</li>
              <li><strong>Booking data:</strong> the experiences you book, timings and participant counts.</li>
              <li><strong>Payment data:</strong> transaction amounts and status. Card details are handled directly by our payment processor (Stripe) — we do not store your card number.</li>
              <li><strong>Technical data:</strong> basic logs needed to run and secure the service.</li>
            </ul>
          </S>

          <S title="Why we use it (purpose)">
            <p>We process your data only for these purposes:</p>
            <ul style={{ paddingLeft: 20, lineHeight: 1.8 }}>
              <li>Creating and managing your account and host profile.</li>
              <li>Processing bookings and payments, and paying out hosts.</li>
              <li>Communicating booking confirmations, changes and support.</li>
              <li>Keeping the platform safe (fraud prevention, age eligibility, abuse) and meeting legal obligations.</li>
            </ul>
          </S>

          <S title="Consent">
            <p>
              By creating an account and using GetBuddyGo, you consent to the processing described above.
              Consent is limited to these stated purposes. You can withdraw consent at any time (see
              "Your rights"); withdrawing it may mean we can no longer provide parts of the service.
              Some processing continues without consent where the law requires it — for example retaining
              transaction records for tax and accounting.
            </p>
          </S>

          <S title="Sharing">
            <p>We share personal data only with:</p>
            <ul style={{ paddingLeft: 20, lineHeight: 1.8 }}>
              <li>The host or guest involved in a booking, to the extent needed to run it.</li>
              <li>Our payment processor (Stripe) to take payments and pay out hosts.</li>
              <li>Service providers who host and operate our infrastructure, under confidentiality obligations.</li>
              <li>Authorities where required by law.</li>
            </ul>
            <p>We do not sell your personal data.</p>
          </S>

          <S title="Retention">
            <p>
              We keep your data for as long as your account is active. If you delete your account, we
              remove or anonymise your personal data within a reasonable period, except records we must
              retain for legal, tax or dispute-resolution reasons.
            </p>
          </S>

          <S title="Age (18+ only)">
            <p>
              GetBuddyGo is intended for users aged 18 and over. We do not knowingly process the personal
              data of children. Under the DPDPA, processing a child's data requires verifiable parental
              consent; because our service is 18+, we do not permit accounts for minors. If you believe a
              minor has created an account, contact us and we will remove it.
            </p>
          </S>

          <S title="Your rights">
            <p>Under the DPDPA you have the right to:</p>
            <ul style={{ paddingLeft: 20, lineHeight: 1.8 }}>
              <li>Access a summary of the personal data we hold and how we process it.</li>
              <li>Correct or update inaccurate or incomplete data.</li>
              <li>Erase your data where it is no longer needed. Deletion requests are reviewed by our team before erasure; you can cancel a pending request from your profile.</li>
              <li>Withdraw consent, and nominate another person to exercise your rights in case of death or incapacity.</li>
              <li>Grievance redressal — raise a complaint and receive a response.</li>
            </ul>
            <p>
              You can exercise most of these from your profile page, or by contacting our Grievance Officer
              below. If you are not satisfied with our response, you may complain to the Data Protection
              Board of India.
            </p>
          </S>

          <S title="Security">
            <p>
              We use reasonable technical and organisational measures to protect your data, including
              hashed passwords and encrypted payment handling. No system is perfectly secure; if a
              personal-data breach occurs, we will notify the Data Protection Board and affected users as
              required by the DPDPA.
            </p>
          </S>

          <S title="Grievance Officer">
            <p>
              As required by the DPDPA, you can reach our Grievance Officer for any privacy question or to
              exercise your rights:
            </p>
            <p>
              {GRIEVANCE_NAME}<br />
              <a href={`mailto:${GRIEVANCE_EMAIL}`}>{GRIEVANCE_EMAIL}</a><br />
              GetBuddyGo, Bengaluru, India
            </p>
          </S>

          <S title="Changes">
            <p>
              We may update this policy. We will post the new effective date here and, for significant
              changes, notify you through the app or by email.
            </p>
          </S>
        </div>
      </div>
    </>
  );
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, getToken } from '../../api';
import { NavBar } from '../../components/ui';

export default function HostPhone() {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<1 | 2>(1);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSendOTP = async () => {
    setErr(null); setLoading(true);
    try {
      if (!getToken()) { navigate('/login'); return; }
      await api.post(`/host/request-verification?phone_number=${encodeURIComponent(phone)}`, {});
      setStep(2);
      setHint('Mock OTP sent. Use code 123456.');
    } catch (e: any) {
      setErr(e?.response?.data?.detail || 'Failed to send OTP.');
    } finally { setLoading(false); }
  };

  const handleVerifyOTP = async () => {
    setErr(null); setLoading(true);
    try {
      await api.post('/host/verify-phone', { phone_number: phone, code: otp });
      navigate('/host/onboarding/profile');
    } catch (e: any) {
      setErr(e?.response?.data?.detail || 'Invalid OTP. For MVP use 123456.');
    } finally { setLoading(false); }
  };

  return (
    <>
      <NavBar />
      <div className="page">
        <div className="container-narrow">
          <button className="btn btn-subtle btn-sm" style={{ marginBottom: 16 }} onClick={() => navigate(-1)}>← Back</button>
          <div className="eyebrow">host onboarding · step 2 of 3</div>
          <h1 className="display-2" style={{ marginTop: 6, marginBottom: 24 }}>
            {step === 1 ? <>verify your <span className="text-cobalt">phone.</span></> : <>enter your <span className="text-coral">code.</span></>}
          </h1>

          <div className="card shadow">
            <p className="text-muted" style={{ marginBottom: 20 }}>
              {step === 1
                ? 'All hosts must be SMS-verified. Your number is never shown to guests.'
                : `We sent a 6-digit code to ${phone}.`}
            </p>

            {step === 1 ? (
              <>
                <div className="field">
                  <label>Phone number</label>
                  <input type="tel" placeholder="+91 98XXX XXXXX" value={phone} onChange={e => setPhone(e.target.value)} />
                </div>
                {err && <div className="pill pill-error" style={{ marginBottom: 12 }}>{err}</div>}
                <button className="btn btn-primary btn-lg" style={{ width: '100%' }} onClick={handleSendOTP} disabled={phone.length < 5 || loading}>
                  {loading ? '…' : 'Send security code →'}
                </button>
                <p className="text-muted mono" style={{ fontSize: 11, textAlign: 'center', marginTop: 12 }}>encrypted at rest · never shared</p>
              </>
            ) : (
              <>
                <div className="field">
                  <label>6-digit code</label>
                  <input
                    type="text" maxLength={6} value={otp}
                    onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    style={{ fontSize: 28, letterSpacing: 12, textAlign: 'center', fontFamily: 'var(--mono)' }}
                  />
                </div>
                {hint && <div className="pill pill-yellow" style={{ marginBottom: 12 }}>{hint}</div>}
                {err && <div className="pill pill-error" style={{ marginBottom: 12 }}>{err}</div>}
                <button className="btn btn-primary btn-lg" style={{ width: '100%' }} onClick={handleVerifyOTP} disabled={otp.length < 6 || loading}>
                  {loading ? '…' : 'Verify →'}
                </button>
                <button className="btn btn-subtle btn-sm" style={{ marginTop: 10, width: '100%' }} onClick={() => setStep(1)}>Change number</button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

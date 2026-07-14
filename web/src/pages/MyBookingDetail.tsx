import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, getToken, apiError } from '../api';
import { NavBar, Photo, StatusPill, Spinner, colorForId, CATEGORY_COLORS } from '../components/ui';

interface BookingDetail {
  id: number; event_id: number; status: string; payment_status: string; created_at: string;
  start_time?: string | null; duration_minutes?: number | null;
  event?: { listing_kind?: string; title: string; description: string; mode: string; start_time: string | null; location_details: string | null; category?: string; event_type?: string; price?: number; };
}

export default function MyBookingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<BookingDetail | null>(null);
  const [payErr, setPayErr] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);

  const payNow = async () => {
    setPayErr(null); setPaying(true);
    try {
      const r = await api.post(`/bookings/${id}/pay`);
      window.location.href = r.data.checkout_url;
    } catch (e: any) {
      setPayErr(apiError(e, 'Could not start payment. Try again.'));
      setPaying(false);
    }
  };

  useEffect(() => {
    (async () => {
      if (!getToken()) { navigate('/login'); return; }
      try {
        const r = await api.get(`/users/me/bookings/${id}`);
        setData(r.data);
      } catch (e) { console.error(e); }
    })();
  }, [id, navigate]);

  if (!data) return (<><NavBar /><div className="page container"><Spinner /></div></>);

  // Service bookings carry the guest-chosen slot; events use the listing schedule
  const happens = data.start_time || data.event?.start_time;

  return (
    <>
      <NavBar />
      <div className="page">
        <div className="container" style={{ maxWidth: 880 }}>
          <button className="btn btn-subtle btn-sm" style={{ marginBottom: 16 }} onClick={() => navigate('/my-bookings')}>← Back to bookings</button>

          <div style={{ borderRadius: 'var(--r-lg)', overflow: 'hidden', border: 'var(--border-card)', marginBottom: 24 }}>
            <Photo label={data.event?.category || data.event?.event_type} color={CATEGORY_COLORS[data.event?.category || ''] || colorForId(data.event_id)} height={260} radius={0} />
          </div>

          <div className="row gap-8" style={{ marginBottom: 12, flexWrap: 'wrap' }}>
            <span className="pill mono" style={{ fontSize: 11 }}>booking #{data.id}</span>
            <StatusPill status={data.status} />
            <StatusPill status={data.payment_status} />
            {data.event?.mode && <span className="pill pill-mint">{data.event.mode}</span>}
          </div>
          <h1 className="display-2" style={{ marginBottom: 6 }}>{data.event?.title || `Event #${data.event_id}`}</h1>
          <div className="text-muted mono" style={{ fontSize: 11, marginBottom: 24 }}>
            booked {new Date(data.created_at).toLocaleDateString()}
            {happens && ` · happens ${new Date(happens).toLocaleString()}`}
            {data.duration_minutes ? ` · ${data.duration_minutes / 60} hr${data.duration_minutes > 60 ? 's' : ''}` : ''}
          </div>

          <div className="card-soft" style={{ marginBottom: 16 }}>
            <div className="section-h">about this experience</div>
            <p style={{ lineHeight: 1.7, fontSize: 15 }}>{data.event?.description}</p>
          </div>

          {data.status === 'REQUESTED' ? (
            <div className="card shadow" style={{ background: 'var(--cobalt-soft)' }}>
              <div className="section-h">waiting on your buddy</div>
              <p style={{ fontSize: 14, lineHeight: 1.6 }}>
                Your request is with the host. Once they accept, you'll pay here and the
                {data.event?.mode === 'Online' ? ' join link' : ' meeting point'} unlocks.
              </p>
            </div>
          ) : (data.status === 'PENDING_PAYMENT' || (data.status === 'CONFIRMED' && data.payment_status !== 'PAID')) ? (
            <div className="card shadow" style={{ background: 'var(--lime)' }}>
              <div className="section-h">{data.status === 'PENDING_PAYMENT' ? 'finish your payment' : 'your buddy said yes!'}</div>
              <p style={{ fontSize: 14, lineHeight: 1.6, marginBottom: 14 }}>
                {data.status === 'PENDING_PAYMENT'
                  ? 'Your seat is held but not confirmed yet — complete the payment to lock it in.'
                  : 'The host accepted your request. Pay now to confirm, and the meeting details unlock right here.'}
              </p>
              {payErr && <div className="pill pill-error" style={{ marginBottom: 10 }}>{payErr}</div>}
              <button className="btn btn-primary btn-lg" onClick={payNow} disabled={paying}>
                {paying ? 'Opening secure checkout…' : 'Pay now →'}
              </button>
              <p className="text-muted mono" style={{ fontSize: 11, marginTop: 10 }}>secure checkout · powered by stripe</p>
            </div>
          ) : data.status === 'DECLINED' ? (
            <div className="card shadow" style={{ background: 'var(--coral-soft)' }}>
              <div className="section-h">request declined</div>
              <p style={{ fontSize: 14, lineHeight: 1.6 }}>
                This buddy couldn't make it this time — you haven't been charged. Try another slot or explore other buddies.
              </p>
            </div>
          ) : (
            <div className="card shadow" style={{ background: 'var(--lime-soft)' }}>
              <div className="section-h">private access · for you</div>
              <p style={{ marginBottom: 12, fontSize: 14 }}>
                Your host shared the following details. Show this on arrival.
              </p>
              <div style={{ background: 'var(--paper)', border: 'var(--border-card)', borderRadius: 'var(--r-sm)', padding: 16 }}>
                <div className="eyebrow">{data.event?.mode === 'Online' ? 'join link' : 'address'}</div>
                <div className="mono" style={{ fontSize: 15, marginTop: 6, wordBreak: 'break-word' }}>
                  {data.event?.location_details || 'No details provided yet.'}
                </div>
              </div>
              <p className="text-muted" style={{ fontSize: 12, marginTop: 14 }}>
                {happens ? `Be ready by ${new Date(happens).toLocaleString()}.` : 'Be ready at the scheduled time.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

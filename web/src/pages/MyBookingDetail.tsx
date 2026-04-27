import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, getToken } from '../api';
import { NavBar, Photo, StatusPill, Spinner, colorForId, CATEGORY_COLORS } from '../components/ui';

interface BookingDetail {
  id: number; event_id: number; status: string; payment_status: string; created_at: string;
  event?: { title: string; description: string; mode: string; start_time: string; location_details: string; category?: string; event_type?: string; price?: number; };
}

export default function MyBookingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<BookingDetail | null>(null);

  useEffect(() => {
    (async () => {
      if (!getToken()) { navigate('/login'); return; }
      try {
        const [b, ev] = await Promise.all([api.get('/users/me/bookings'), api.get('/events')]);
        const m = b.data.find((bk: any) => bk.id.toString() === id);
        if (m) {
          const e = ev.data.find((e: any) => e.id === m.event_id);
          setData({ ...m, event: e });
        }
      } catch (e) { console.error(e); }
    })();
  }, [id, navigate]);

  if (!data) return (<><NavBar /><div className="page container"><Spinner /></div></>);

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
            purchased {new Date(data.created_at).toLocaleDateString()}
            {data.event?.start_time && ` · happens ${new Date(data.event.start_time).toLocaleString()}`}
          </div>

          <div className="card-soft" style={{ marginBottom: 16 }}>
            <div className="section-h">about this experience</div>
            <p style={{ lineHeight: 1.7, fontSize: 15 }}>{data.event?.description}</p>
          </div>

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
              {data.event?.start_time
                ? `Be ready by ${new Date(data.event.start_time).toLocaleString()}.`
                : 'Be ready at the scheduled time.'}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

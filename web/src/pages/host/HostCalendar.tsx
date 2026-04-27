import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, getToken } from '../../api';
import { NavBar, Spinner, Empty } from '../../components/ui';

interface ScheduleItem { title: string; start_time: string; attendees: number; }

export default function HostCalendar() {
  const [events, setEvents] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      if (!getToken()) { navigate('/login'); return; }
      try {
        const [, , bookings] = await Promise.all([
          api.get('/users/me'),
          api.get('/events'),
          api.get('/host/me/bookings'),
        ]);
        const map = new Map<string, ScheduleItem>();
        bookings.data.forEach((b: any) => {
          const cur = map.get(b.event_title);
          map.set(b.event_title, {
            title: b.event_title,
            start_time: b.start_time,
            attendees: (cur?.attendees || 0) + 1,
          });
        });
        const sorted = Array.from(map.values()).sort((a, b) =>
          new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
        );
        setEvents(sorted);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, [navigate]);

  return (
    <>
      <NavBar />
      <div className="page">
        <div className="container" style={{ maxWidth: 880 }}>
          <div className="eyebrow">your schedule</div>
          <h1 className="display-2" style={{ marginTop: 6, marginBottom: 24 }}>calendar</h1>

          {loading ? <Spinner /> : events.length === 0 ? (
            <Empty title="Nothing on the schedule" hint="Once guests book, your sessions will populate here."
              action={<button className="btn btn-primary" onClick={() => navigate('/host/create')}>+ New listing</button>} />
          ) : (
            <div className="stack gap-12">
              {events.map((e, i) => {
                const d = new Date(e.start_time);
                return (
                  <div key={i} className="card shadow" style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 24, alignItems: 'center' }}>
                    <div style={{
                      minWidth: 84, textAlign: 'center', padding: '14px 16px',
                      background: 'var(--lime)', borderRadius: 'var(--r-sm)', border: 'var(--border-card)',
                    }}>
                      <div className="display-2" style={{ fontSize: 32, lineHeight: 1, color: 'var(--ink)' }}>{d.getDate()}</div>
                      <div className="mono" style={{ fontSize: 10, marginTop: 4, letterSpacing: 1.4 }}>
                        {d.toLocaleString([], { month: 'short' }).toUpperCase()}
                      </div>
                    </div>
                    <div>
                      <h3 className="h3" style={{ marginBottom: 6 }}>{e.title}</h3>
                      <div className="text-muted mono" style={{ fontSize: 12 }}>
                        {d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {d.toLocaleDateString([], { weekday: 'long' })}
                      </div>
                    </div>
                    <div style={{ textAlign: 'center', padding: '12px 18px', background: 'var(--cobalt-soft)', borderRadius: 'var(--r-sm)' }}>
                      <div className="display-2" style={{ fontSize: 22, color: 'var(--cobalt)' }}>{e.attendees}</div>
                      <div className="mono" style={{ fontSize: 9, color: 'var(--cobalt)', letterSpacing: 1.2 }}>ATTENDING</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

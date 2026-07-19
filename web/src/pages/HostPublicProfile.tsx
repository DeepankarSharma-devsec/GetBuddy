import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { NavBar, Avatar, Stars, Spinner, Empty, colorForId, countryName } from '../components/ui';
import { ListingCard } from './Explore';

interface PublicHost {
  host_id: number; name: string; photo?: string | null; bio?: string | null;
  expertise?: string | null; category?: string | null; city?: string | null; country?: string;
  phone_verified: boolean; member_since?: string;
  instagram?: string | null; linkedin?: string | null; website?: string | null;
  rating?: number | null; review_count: number;
  reviews: { star_rating: number; review_text: string; created_at: string }[];
  listings: any[];
}

const asUrl = (v: string, base: string) => (v.startsWith('http') ? v : `${base}${v.replace(/^@/, '')}`);

export default function HostPublicProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [host, setHost] = useState<PublicHost | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    api.get(`/hosts/${id}/public`).then(r => setHost(r.data)).catch(() => setMissing(true));
  }, [id]);

  if (missing) return (<><NavBar /><div className="page container"><Empty title="Host not found" hint="This host may no longer be active." /></div></>);
  if (!host) return (<><NavBar /><div className="page container"><Spinner /></div></>);

  const socials = [
    host.instagram && { label: 'Instagram', href: asUrl(host.instagram, 'https://instagram.com/') },
    host.linkedin && { label: 'LinkedIn', href: asUrl(host.linkedin, 'https://linkedin.com/in/') },
    host.website && { label: 'Website', href: asUrl(host.website, 'https://') },
  ].filter(Boolean) as { label: string; href: string }[];

  return (
    <>
      <NavBar />
      <div className="page">
        <div className="container" style={{ maxWidth: 960 }}>
          <button className="btn btn-subtle btn-sm" style={{ marginBottom: 20 }} onClick={() => navigate(-1)}>← Back</button>

          <div className="card shadow" style={{ marginBottom: 24 }}>
            <div className="row gap-20" style={{ flexWrap: 'wrap' }}>
              <Avatar name={host.name} color={colorForId(host.host_id)} size={96} src={host.photo} />
              <div className="grow" style={{ minWidth: 220 }}>
                <h1 className="h2" style={{ marginBottom: 6 }}>{host.name}</h1>
                <div className="row gap-6" style={{ flexWrap: 'wrap', marginBottom: 8 }}>
                  {host.phone_verified && <span className="pill pill-mint">phone verified</span>}
                  {host.category && <span className="pill">{host.category}</span>}
                  {(host.city || host.country) && <span className="pill">{host.city || countryName(host.country || '')}</span>}
                  {host.member_since && <span className="pill">hosting since {new Date(host.member_since).getFullYear()}</span>}
                </div>
                {host.review_count > 0 && host.rating != null ? (
                  <div className="row gap-8"><Stars value={host.rating} size={16} /><span style={{ fontWeight: 700 }}>{host.rating}</span><span className="text-muted" style={{ fontSize: 13 }}>({host.review_count} review{host.review_count > 1 ? 's' : ''})</span></div>
                ) : (
                  <span className="text-muted" style={{ fontSize: 13 }}>New host — no reviews yet</span>
                )}
                {host.expertise && <div className="text-muted" style={{ fontSize: 13, marginTop: 8 }}>{host.expertise}</div>}
              </div>
              {socials.length > 0 && (
                <div className="stack gap-8">
                  {socials.map(s => (
                    <a key={s.label} className="btn btn-subtle btn-sm" href={s.href} target="_blank" rel="noopener noreferrer">{s.label} ↗</a>
                  ))}
                </div>
              )}
            </div>
            {host.bio && (
              <div style={{ marginTop: 18, borderTop: '1px solid var(--line)', paddingTop: 16 }}>
                <div className="section-h">about</div>
                <p style={{ lineHeight: 1.7, fontSize: 15, whiteSpace: 'pre-wrap', maxWidth: 640 }}>{host.bio}</p>
              </div>
            )}
          </div>

          <div className="section-h">listings by {host.name.split(' ')[0]}</div>
          {host.listings.length === 0 ? (
            <div className="card-soft text-muted" style={{ fontSize: 14, marginBottom: 24 }}>No live listings right now — check back soon.</div>
          ) : (
            <div className="grid grid-3" style={{ marginBottom: 32 }}>
              {host.listings.map(ev => <ListingCard key={ev.id} ev={ev} onClick={() => navigate(`/listing/${ev.id}`)} />)}
            </div>
          )}

          {host.reviews.length > 0 && (
            <>
              <div className="section-h">what guests say</div>
              <div className="grid grid-2">
                {host.reviews.map((r, i) => (
                  <div key={i} className="card-soft">
                    <div className="row gap-8" style={{ marginBottom: 8 }}>
                      <Stars value={r.star_rating} />
                      <span className="text-muted mono" style={{ fontSize: 10 }}>{new Date(r.created_at).toLocaleDateString()}</span>
                    </div>
                    <p style={{ fontSize: 14, lineHeight: 1.6 }}>{r.review_text}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

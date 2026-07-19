import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { NavBar, SERVICE_CATEGORIES, getCity } from '../components/ui';

const EVENT_CATEGORIES = [
  { id: 'music', label: 'Music' }, { id: 'tech', label: 'Technology' },
  { id: 'lifestyle', label: 'Lifestyle' }, { id: 'business', label: 'Business' },
  { id: 'food', label: 'Food' }, { id: 'outdoor', label: 'Outdoor' },
];

export default function SearchFilter() {
  const [kind, setKind] = useState<'EVENT' | 'SERVICE'>('EVENT');
  const [query, setQuery] = useState('');
  const [city, setCity] = useState(getCity());
  const [category, setCategory] = useState('');
  const [mode, setMode] = useState('');
  const [traveller, setTraveller] = useState(false);
  const navigate = useNavigate();

  const isService = kind === 'SERVICE';
  const categories = isService ? SERVICE_CATEGORIES : EVENT_CATEGORIES;

  const handleApply = () => {
    const params = new URLSearchParams();
    if (isService) params.set('kind', 'SERVICE');
    if (query) params.set('q', query);
    if (city) params.set('city', city);
    if (category) params.set('category', category);
    if (mode) params.set('mode', mode);
    if (traveller) params.set('traveller', 'true');
    navigate(`/explore?${params.toString()}`);
  };

  const reset = () => { setQuery(''); setCity(''); setCategory(''); setMode(''); setTraveller(false); };

  return (
    <>
      <NavBar />
      <div className="page">
        <div className="container-narrow">
          <button className="btn btn-subtle btn-sm" style={{ marginBottom: 16 }} onClick={() => navigate(-1)}>← Back</button>
          <div className="eyebrow">refine your search</div>
          <h1 className="display-2 vintage-head" style={{ marginTop: 6, marginBottom: 24 }}>find your <em className="text-coral">vibe.</em></h1>

          <div className="card shadow">
            <div className={`kind-strip ${isService ? 'buddy' : 'event'}`} />
            <div className="field">
              <label>Looking for</label>
              <div className="row gap-8">
                <button className={`btn grow ${!isService ? 'btn-coral' : 'btn-subtle'}`} onClick={() => { setKind('EVENT'); setCategory(''); }}>🎟 An event</button>
                <button className={`btn grow ${isService ? 'btn-cobalt' : 'btn-subtle'}`} onClick={() => { setKind('SERVICE'); setCategory(''); }}>🤝 A buddy</button>
              </div>
            </div>
            <div className="field">
              <label>Keyword</label>
              <input type="text" placeholder={isService ? 'e.g. movie, shopping, gym' : 'e.g. trek, jazz, coffee chat'} value={query} onChange={e => setQuery(e.target.value)} />
            </div>
            <div className="field">
              <label>City</label>
              <input type="text" placeholder="e.g. Bengaluru — works even if you're just visiting" value={city} onChange={e => setCity(e.target.value)} />
            </div>
            <div className="field">
              <label>Category</label>
              <div className="row gap-8" style={{ flexWrap: 'wrap' }}>
                <button className={`chip ${category === '' ? 'active' : ''}`} onClick={() => setCategory('')}>All</button>
                {categories.map(c => (
                  <button key={c.id} className={`chip ${category === c.id ? 'active' : ''}`} onClick={() => setCategory(c.id)}>{c.label}</button>
                ))}
              </div>
            </div>
            <div className="field">
              <label>Mode</label>
              <select value={mode} onChange={e => setMode(e.target.value)}>
                <option value="">Online & Offline</option>
                <option value="Online">Online</option>
                <option value="Offline">Offline (in person)</option>
              </select>
            </div>
            <label className="row gap-8" style={{ cursor: 'pointer', fontSize: 13, fontWeight: 600, marginBottom: 24 }}>
              <input type="checkbox" checked={traveller} onChange={e => setTraveller(e.target.checked)} style={{ width: 16, height: 16 }} />
              ✈ Visitor-friendly only (great if you're new in town or from abroad)
            </label>
            <div className="row gap-12">
              <button className="btn btn-subtle" onClick={reset}>Reset</button>
              <button className="btn btn-primary grow" onClick={handleApply}>Show results →</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

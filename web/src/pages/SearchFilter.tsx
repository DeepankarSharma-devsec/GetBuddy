import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { NavBar } from '../components/ui';

export default function SearchFilter() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [type, setType] = useState('');
  const [mode, setMode] = useState('');
  const navigate = useNavigate();

  const handleApply = () => {
    const params = new URLSearchParams();
    if (query) params.append('q', query.toLowerCase());
    if (category) params.append('category', category);
    if (type) params.append('type', type);
    if (mode) params.append('mode', mode);
    navigate(`/explore?${params.toString()}`);
  };

  const reset = () => { setQuery(''); setCategory(''); setType(''); setMode(''); };

  return (
    <>
      <NavBar />
      <div className="page">
        <div className="container-narrow">
          <button className="btn btn-subtle btn-sm" style={{ marginBottom: 16 }} onClick={() => navigate(-1)}>← Back</button>
          <div className="eyebrow">refine your search</div>
          <h1 className="display-2" style={{ marginTop: 6, marginBottom: 24 }}>find your <span className="text-coral">vibe.</span></h1>

          <div className="card shadow">
            <div className="field">
              <label>Keyword</label>
              <input type="text" placeholder="e.g. trek, jazz, coffee chat" value={query} onChange={e => setQuery(e.target.value)} />
            </div>
            <div className="field">
              <label>Category</label>
              <select value={category} onChange={e => setCategory(e.target.value)}>
                <option value="">All categories</option>
                <option value="music">Music</option>
                <option value="tech">Technology</option>
                <option value="lifestyle">Lifestyle</option>
                <option value="business">Business</option>
              </select>
            </div>
            <div className="field">
              <label>Session type</label>
              <select value={type} onChange={e => setType(e.target.value)}>
                <option value="">Any</option>
                <option value="1:1 Session">1:1 Session</option>
                <option value="Group Session">Group Session</option>
                <option value="Online Event">Online Event</option>
                <option value="Offline Event">Offline Event</option>
              </select>
            </div>
            <div className="field" style={{ marginBottom: 24 }}>
              <label>Mode</label>
              <select value={mode} onChange={e => setMode(e.target.value)}>
                <option value="">Online & Offline</option>
                <option value="Online">Online</option>
                <option value="Offline">Offline</option>
              </select>
            </div>
            <div className="row gap-12">
              <button className="btn btn-subtle" onClick={reset}>Reset</button>
              <button className="btn btn-primary grow" onClick={handleApply}>Apply filters →</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

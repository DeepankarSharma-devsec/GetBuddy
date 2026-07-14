import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, getToken } from '../../api';
import { NavBar, StatusPill, Spinner, Empty, sym } from '../../components/ui';

interface Transaction {
  id: number;
  booking_id: number;
  gross_amount: number;
  platform_commission: number;
  host_payout: number;
  currency?: string;
  payout_status: string;
  created_at: string;
}

export default function TransactionsScreen() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [ratePct, setRatePct] = useState('');       // commission as a percentage, e.g. "15"
  const [savedPct, setSavedPct] = useState('');     // last saved value, to detect changes
  const [savingRate, setSavingRate] = useState(false);
  const [rateMsg, setRateMsg] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      if (!getToken()) { navigate('/login'); return; }
      try {
        const [tx, settings] = await Promise.all([
          api.get('/admin/transactions'),
          api.get('/admin/settings'),
        ]);
        setTransactions(tx.data);
        const pct = String(Math.round((settings.data.commission_rate ?? 0.15) * 100));
        setRatePct(pct); setSavedPct(pct);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, [navigate]);

  const saveRate = async () => {
    const pct = Number(ratePct);
    if (Number.isNaN(pct) || pct < 0 || pct > 90) { setRateMsg('Enter 0–90'); return; }
    setSavingRate(true); setRateMsg('');
    try {
      await api.put('/admin/settings', { commission_rate: pct / 100 });
      setSavedPct(String(pct)); setRateMsg('Saved ✓');
    } catch (e) { console.error(e); setRateMsg('Failed'); }
    finally { setSavingRate(false); }
  };

  const togglePayout = async (id: number) => {
    try {
      const r = await api.post(`/admin/transactions/${id}/payout`);
      setTransactions(ts => ts.map(t => t.id === id ? { ...t, payout_status: r.data.payout_status } : t));
    } catch (e) { console.error(e); }
  };

  // Sums must stay per-currency — never add ₹ to $ to ¥. Optional predicate filters rows.
  const byCurrency = (
    field: keyof Pick<Transaction, 'gross_amount' | 'platform_commission' | 'host_payout'>,
    filter?: (t: Transaction) => boolean,
  ) => {
    const acc: Record<string, number> = {};
    for (const t of transactions) {
      if (filter && !filter(t)) continue;
      const c = t.currency || 'INR';
      acc[c] = (acc[c] || 0) + t[field];
    }
    const parts = Object.entries(acc).map(([c, v]) => `${sym(c)}${Math.round(v).toLocaleString()}`);
    return parts.length ? parts.join(' + ') : `${sym()}0`;
  };

  const isPaid = (t: Transaction) => t.payout_status === 'PAID';
  const rateDirty = ratePct !== savedPct;

  return (
    <>
      <NavBar />
      <div className="page">
        <div className="container">
          <div className="row between" style={{ marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div className="eyebrow">money flow</div>
              <h1 className="display-2" style={{ marginTop: 6 }}>transactions log</h1>
            </div>
            <button className="btn btn-subtle" onClick={() => navigate('/admin/dashboard')}>← Dashboard</button>
          </div>

          {/* Commission control — applies to future settlements, not past transactions */}
          <div className="card shadow" style={{ marginBottom: 24 }}>
            <div className="row between" style={{ flexWrap: 'wrap', gap: 12, alignItems: 'flex-end' }}>
              <div>
                <div className="label" style={{ marginBottom: 6 }}>platform commission</div>
                <div className="row" style={{ gap: 8, alignItems: 'center' }}>
                  <input
                    type="number" min={0} max={90} value={ratePct}
                    onChange={e => setRatePct(e.target.value)}
                    style={{ width: 90, padding: '8px 10px', border: '1px solid var(--line2)', borderRadius: 10, fontWeight: 700, fontSize: 16 }}
                  />
                  <span style={{ fontWeight: 700, fontSize: 16 }}>%</span>
                  <button className="btn btn-primary btn-sm" onClick={saveRate} disabled={savingRate || !rateDirty}>
                    {savingRate ? 'Saving…' : 'Save'}
                  </button>
                  {rateMsg && <span className="text-muted" style={{ fontSize: 13 }}>{rateMsg}</span>}
                </div>
              </div>
              <div className="text-muted" style={{ fontSize: 12, maxWidth: 320 }}>
                Taken from each booking’s gross. Changing it affects new bookings only — past transactions keep their recorded split.
              </div>
            </div>
          </div>

          <div className="grid grid-3" style={{ marginBottom: 16 }}>
            <div className="metric">
              <div className="label">gross volume</div>
              <div className="value" style={{ fontSize: 24 }}>{byCurrency('gross_amount')}</div>
            </div>
            <div className="metric" style={{ background: 'var(--ink)', color: 'var(--lime)', border: 'var(--border-card)' }}>
              <div className="label" style={{ color: 'rgba(214,242,107,0.7)' }}>platform commission</div>
              <div className="value" style={{ color: 'var(--lime)', fontSize: 24 }}>{byCurrency('platform_commission')}</div>
            </div>
            <div className="metric">
              <div className="label">total host payouts</div>
              <div className="value" style={{ fontSize: 24 }}>{byCurrency('host_payout')}</div>
            </div>
          </div>

          {/* Payout tracking: what's still owed vs already sent */}
          <div className="grid grid-2" style={{ marginBottom: 24 }}>
            <div className="metric" style={{ borderColor: 'var(--coral-soft)' }}>
              <div className="label" style={{ color: 'var(--coral)' }}>payout owed (to send)</div>
              <div className="value" style={{ fontSize: 24, color: 'var(--coral)' }}>{byCurrency('host_payout', t => !isPaid(t))}</div>
            </div>
            <div className="metric">
              <div className="label">payout sent</div>
              <div className="value" style={{ fontSize: 24 }}>{byCurrency('host_payout', isPaid)}</div>
            </div>
          </div>

          {loading ? <Spinner /> : transactions.length === 0 ? (
            <Empty title="No transactions yet" hint="Once guests pay, the ledger fills up here." />
          ) : (
            <div className="card shadow" style={{ padding: 0, overflow: 'hidden' }}>
              <table className="gbg-table">
                <thead>
                  <tr>
                    <th>TX</th>
                    <th>Booking</th>
                    <th>Gross</th>
                    <th>Commission</th>
                    <th>Host payout</th>
                    <th>Payout status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map(t => (
                    <tr key={t.id}>
                      <td><div style={{ fontWeight: 600 }}>#{t.id}</div></td>
                      <td className="text-muted">#{t.booking_id}</td>
                      <td style={{ fontWeight: 600 }}>{sym(t.currency)}{Math.round(t.gross_amount).toLocaleString()}</td>
                      <td style={{ color: 'var(--cobalt)', fontWeight: 600 }}>{sym(t.currency)}{Math.round(t.platform_commission).toLocaleString()}</td>
                      <td>{sym(t.currency)}{Math.round(t.host_payout).toLocaleString()}</td>
                      <td><StatusPill status={t.payout_status} /></td>
                      <td>
                        <button className="btn btn-sm btn-subtle" onClick={() => togglePayout(t.id)}>
                          {isPaid(t) ? 'Mark unpaid' : 'Mark sent'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

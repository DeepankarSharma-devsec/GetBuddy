import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, getToken } from '../../api';
import { NavBar, StatusPill, Spinner, Empty } from '../../components/ui';

interface Transaction {
  id: number;
  booking_id: number;
  gross_amount: number;
  platform_commission: number;
  host_payout: number;
  payout_status: string;
  created_at: string;
}

export default function TransactionsScreen() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      if (!getToken()) { navigate('/login'); return; }
      try { setTransactions((await api.get('/admin/transactions')).data); }
      catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, [navigate]);

  const totals = transactions.reduce(
    (acc, t) => ({
      gross: acc.gross + t.gross_amount,
      commission: acc.commission + t.platform_commission,
      payout: acc.payout + t.host_payout,
    }),
    { gross: 0, commission: 0, payout: 0 }
  );

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

          <div className="grid grid-3" style={{ marginBottom: 24 }}>
            <div className="metric">
              <div className="label">gross volume</div>
              <div className="value">₹{totals.gross.toFixed(0)}</div>
            </div>
            <div className="metric" style={{ background: 'var(--ink)', color: 'var(--lime)', border: 'var(--border-card)' }}>
              <div className="label" style={{ color: 'rgba(214,242,107,0.7)' }}>platform commission</div>
              <div className="value" style={{ color: 'var(--lime)' }}>₹{totals.commission.toFixed(0)}</div>
            </div>
            <div className="metric">
              <div className="label">host payouts</div>
              <div className="value">₹{totals.payout.toFixed(0)}</div>
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
                  </tr>
                </thead>
                <tbody>
                  {transactions.map(t => (
                    <tr key={t.id}>
                      <td><div style={{ fontWeight: 600 }}>#{t.id}</div></td>
                      <td className="text-muted">#{t.booking_id}</td>
                      <td style={{ fontWeight: 600 }}>₹{t.gross_amount.toFixed(0)}</td>
                      <td style={{ color: 'var(--cobalt)', fontWeight: 600 }}>₹{t.platform_commission.toFixed(0)}</td>
                      <td>₹{t.host_payout.toFixed(0)}</td>
                      <td><StatusPill status={t.payout_status} /></td>
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

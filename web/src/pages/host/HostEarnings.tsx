import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, getToken } from '../../api';
import { NavBar, Spinner, Empty } from '../../components/ui';

interface Tx { id: number; event_title: string; host_payout: number; gross_amount: number; platform_commission: number; created_at: string; }

export default function HostEarnings() {
  const [transactions, setTransactions] = useState<Tx[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      if (!getToken()) { navigate('/login'); return; }
      try {
        const r = await api.get('/host/me/transactions');
        setTransactions(r.data);
        setTotal(r.data.reduce((a: number, c: Tx) => a + c.host_payout, 0));
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, [navigate]);

  return (
    <>
      <NavBar />
      <div className="page">
        <div className="container" style={{ maxWidth: 880 }}>
          <div className="eyebrow">your money</div>
          <h1 className="display-2" style={{ marginTop: 6, marginBottom: 24 }}>earnings</h1>

          <div className="card shadow" style={{ background: 'var(--ink)', color: 'var(--lime)', marginBottom: 24 }}>
            <div className="row between" style={{ flexWrap: 'wrap', gap: 16 }}>
              <div>
                <div className="eyebrow" style={{ color: 'rgba(214,242,107,0.7)' }}>lifetime payouts (after 15% fee)</div>
                <div className="display-1" style={{ color: 'var(--lime)', fontSize: 56, marginTop: 4 }}>₹{total.toFixed(0)}</div>
              </div>
              <div className="stack gap-8" style={{ alignItems: 'flex-end' }}>
                <span className="pill pill-ink" style={{ background: 'var(--lime)', color: 'var(--ink)' }}>UPI · WEEKLY</span>
                <span className="mono" style={{ fontSize: 11, color: 'rgba(214,242,107,0.7)' }}>NEXT PAYOUT · MON 09:00 IST</span>
              </div>
            </div>
          </div>

          <div className="eyebrow" style={{ marginBottom: 12 }}>recent transactions</div>
          {loading ? <Spinner /> : transactions.length === 0 ? (
            <Empty title="No transactions yet" hint="Once guests pay, payouts land here weekly." />
          ) : (
            <div className="stack gap-12">
              {transactions.map((tx) => (
                <div key={tx.id} className="card shadow row between" style={{ alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                  <div>
                    <h4 className="h3" style={{ fontSize: 16, marginBottom: 4 }}>{tx.event_title}</h4>
                    <div className="text-muted mono" style={{ fontSize: 11 }}>{new Date(tx.created_at).toLocaleString()}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="display-2" style={{ fontSize: 22, color: 'var(--cobalt)' }}>+₹{tx.host_payout.toFixed(0)}</div>
                    <div className="text-muted" style={{ fontSize: 11 }}>
                      gross ₹{tx.gross_amount.toFixed(0)} − fee ₹{tx.platform_commission.toFixed(0)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

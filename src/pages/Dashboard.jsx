import { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import Badge from '../components/Badge';
import { fmt, fmtN, inRange, today } from '../utils/helpers';

function setMonthStart() {
  const t = today();
  return t.slice(0, 7) + '-01';
}

export default function Dashboard() {
  const { sales, purchases, products, expenses, customersLedger, suppliersLedger } = useData();
  const [from, setFrom] = useState(setMonthStart());
  const [to, setTo] = useState(today());

  const quickSet = mode => {
    const t = today();
    const now = new Date();
    if (mode === 'today') { setFrom(t); setTo(t); }
    else if (mode === 'week') {
      const wd = (now.getDay() + 6) % 7;
      const s = new Date(now.getTime() - wd * 86400000);
      setFrom(s.toISOString().slice(0, 10)); setTo(t);
    } else if (mode === 'month') { setFrom(t.slice(0, 7) + '-01'); setTo(t); }
    else if (mode === 'year') { setFrom(t.slice(0, 4) + '-01-01'); setTo(t); }
    else { setFrom('2000-01-01'); setTo(t); }
  };

  const salesIn = sales.filter(s => inRange(s.date, from, to));
  const purchIn = purchases.filter(p => inRange(p.date, from, to));
  const expIn = expenses.filter(e => inRange(e.date, from, to));
  const totalSales = salesIn.reduce((a, s) => a + s.total, 0);
  const totalPurch = purchIn.reduce((a, p) => a + p.total, 0);
  const totalExp = expIn.reduce((a, e) => a + Number(e.amount || 0), 0);

  let grossProfit = 0;
  salesIn.forEach(s => s.items.forEach(i => {
    const c = i.cost != null ? i.cost : (products.find(p => p.id === i.productId)?.cost || 0);
    grossProfit += (i.price - c) * i.qty;
  }));

  const recv = customersLedger.reduce((a, c) => a + Math.max(0, c.balance), 0);
  const pay = suppliersLedger.reduce((a, s) => a + Math.max(0, s.balance), 0);
  const lowStock = products.filter(p => p.stock <= p.minStock);
  const rangeLabel = (from || to) ? `${from || '…'} → ${to || '…'}` : 'All Time';

  const recentSales = [...sales].reverse().slice(0, 8);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <label style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 600 }}>From</label>
          <input type="date" value={from} onChange={e => setFrom(e.target.value)} style={{ width: 150 }} />
          <label style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 600 }}>To</label>
          <input type="date" value={to} onChange={e => setTo(e.target.value)} style={{ width: 150 }} />
          {['today', 'week', 'month', 'year', 'all'].map(m => (
            <button key={m} className="btn btn-secondary btn-sm" onClick={() => quickSet(m)}>
              {m === 'all' ? 'All Time' : m === 'week' ? 'This Week' : m === 'month' ? 'This Month' : m === 'year' ? 'This Year' : 'Today'}
            </button>
          ))}
        </div>
      </div>

      <div className="cards-grid">
        <div className="card"><div className="card-label">Sales ({rangeLabel})</div><div className="card-value teal mono">{fmt(totalSales)}</div><div className="card-sub">{salesIn.length} invoices</div></div>
        <div className="card"><div className="card-label">Gross Profit ({rangeLabel})</div><div className={`card-value ${grossProfit >= 0 ? 'green' : 'red'} mono`}>{fmt(grossProfit)}</div><div className="card-sub">Revenue minus cost of goods</div></div>
        <div className="card"><div className="card-label">Purchases ({rangeLabel})</div><div className="card-value amber mono">{fmt(totalPurch)}</div><div className="card-sub">{purchIn.length} entries</div></div>
        <div className="card"><div className="card-label">Expenses ({rangeLabel})</div><div className="card-value red mono">{fmt(totalExp)}</div><div className="card-sub">{expIn.length} entries</div></div>
        <div className="card"><div className="card-label">Receivables</div><div className="card-value blue mono">{fmt(recv)}</div><div className="card-sub">Customers owe you</div></div>
        <div className="card"><div className="card-label">Payables</div><div className="card-value amber mono">{fmt(pay)}</div><div className="card-sub">You owe suppliers</div></div>
        <div className="card"><div className="card-label">Low Stock Alerts</div><div className={`card-value ${lowStock.length ? 'red' : 'green'} mono`}>{lowStock.length}</div><div className="card-sub">Below min stock</div></div>
        <div className="card"><div className="card-label">Total Invoices</div><div className="card-value mono">{sales.length}</div><div className="card-sub">{purchases.length} purchases</div></div>
      </div>

      <div className="dash-grid-two">
        <div className="table-wrap">
          <div className="table-header"><h3>Recent Sales</h3></div>
          <div className="table-scroll">
            <table>
              <thead><tr><th>Customer</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead>
              <tbody>
                {recentSales.length ? recentSales.map(s => (
                  <tr key={s.id}>
                    <td>{s.customer}</td>
                    <td className="mono">{fmt(s.total)}</td>
                    <td><Badge status={s.status} /></td>
                    <td style={{ color: 'var(--text3)', fontSize: 12 }}>{s.date}</td>
                  </tr>
                )) : <tr><td colSpan={4} className="empty"><p>No sales yet</p></td></tr>}
              </tbody>
            </table>
          </div>
        </div>
        <div className="table-wrap">
          <div className="table-header"><h3>Low Stock Alert</h3></div>
          <div className="table-scroll">
            <table>
              <thead><tr><th>Product</th><th>Stock</th><th>Min</th></tr></thead>
              <tbody>
                {lowStock.length ? lowStock.map(p => (
                  <tr key={p.id}>
                    <td>{p.name}</td>
                    <td className="mono" style={{ color: 'var(--danger)', fontWeight: 700 }}>{p.stock}</td>
                    <td className="mono" style={{ color: 'var(--text3)' }}>{p.minStock}</td>
                  </tr>
                )) : <tr><td colSpan={3} style={{ textAlign: 'center', color: 'var(--success)', padding: 20, fontSize: 13 }}>✓ All stock levels OK</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

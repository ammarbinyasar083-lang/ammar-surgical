import { useState } from 'react';
import { useData } from '../context/DataContext';
import Badge from '../components/Badge';
import { fmt, fmtN } from '../utils/helpers';
import { today } from '../utils/helpers';
import { exportSales, exportPurchases, exportExpenses, exportLedger, downloadCSV, downloadXLSX, downloadPDF } from '../utils/export';

export default function Reports() {
  const { sales, purchases, products, expenses, payments, customersLedger, suppliersLedger } = useData();
  const [tab, setTab] = useState('sales');

  const exportReport = fmt => {
    if (tab === 'sales') exportSales(fmt, sales);
    else if (tab === 'purchases') exportPurchases(fmt, purchases);
    else if (tab === 'profit') exportProfitReport(fmt);
    else if (tab === 'daily') exportDailySummary(fmt);
    else if (tab === 'ar') exportARReport(fmt);
  };

  const exportProfitReport = fmtType => {
    const byP = {}; let rev = 0, cost = 0;
    sales.forEach(s => s.items.forEach(i => {
      rev += i.total;
      const c = i.cost != null ? i.cost : (products.find(p => p.id === i.productId)?.cost || 0);
      const ic = c * i.qty; cost += ic;
      byP[i.name] = byP[i.name] || { name: i.name, qty: 0, revenue: 0, cost: 0 };
      byP[i.name].qty += i.qty; byP[i.name].revenue += i.total; byP[i.name].cost += ic;
    }));
    const headers = ['Product', 'Qty', 'Revenue', 'Cost', 'Profit', 'Margin %'];
    const rows = Object.values(byP).map(r => { const p = r.revenue - r.cost; const m = r.revenue > 0 ? (p / r.revenue * 100).toFixed(1) : 0; return [r.name, r.qty, r.revenue, r.cost, p, m]; });
    const name = 'profit_report_' + today();
    const totals = [`Total Revenue: ${fmt(rev)}`, `Total Cost: ${fmt(cost)}`, `Gross Profit: ${fmt(rev - cost)}`];
    if (fmtType === 'csv') downloadCSV(name, headers, rows);
    else if (fmtType === 'xlsx') downloadXLSX(name, 'Profit', headers, rows);
    else downloadPDF('Profit Report', headers, rows, { landscape: true, totals });
  };

  const exportDailySummary = fmtType => {
    const days = {};
    sales.forEach(s => { days[s.date] = days[s.date] || { d: s.date, sales: 0, collected: 0, purchases: 0, paidOut: 0, expenses: 0 }; days[s.date].sales += s.total; days[s.date].collected += s.paid; });
    purchases.forEach(p => { days[p.date] = days[p.date] || { d: p.date, sales: 0, collected: 0, purchases: 0, paidOut: 0, expenses: 0 }; days[p.date].purchases += p.total; days[p.date].paidOut += p.paid; });
    expenses.forEach(e => { days[e.date] = days[e.date] || { d: e.date, sales: 0, collected: 0, purchases: 0, paidOut: 0, expenses: 0 }; days[e.date].expenses += Number(e.amount || 0); });
    const headers = ['Date', 'Sales', 'Collected', 'Purchases', 'Paid Out', 'Expenses', 'Net Cash'];
    const rows = Object.values(days).sort((a, b) => a.d.localeCompare(b.d)).map(r => [r.d, r.sales, r.collected, r.purchases, r.paidOut, r.expenses, r.collected - r.paidOut - r.expenses]);
    const name = 'daily_summary_' + today();
    if (fmtType === 'csv') downloadCSV(name, headers, rows);
    else if (fmtType === 'xlsx') downloadXLSX(name, 'Daily', headers, rows);
    else downloadPDF('Daily Summary', headers, rows, { landscape: true });
  };

  const exportARReport = fmtType => {
    const cust = customersLedger.filter(c => c.balance > 0);
    const sup = suppliersLedger.filter(s => s.balance > 0);
    const rows = [...cust.map(c => ['Receivable', c.name, c.balance]), ...sup.map(s => ['Payable', s.name, s.balance])];
    const headers = ['Type', 'Party', 'Balance'];
    const name = 'receivables_payables_' + today();
    if (fmtType === 'csv') downloadCSV(name, headers, rows);
    else if (fmtType === 'xlsx') downloadXLSX(name, 'AR_AP', headers, rows);
    else downloadPDF('Receivables & Payables', headers, rows);
  };

  const renderPanel = () => {
    if (tab === 'sales') {
      const grouped = {};
      sales.forEach(s => { const m = s.date.slice(0, 7); if (!grouped[m]) grouped[m] = { month: m, count: 0, total: 0, paid: 0 }; grouped[m].count++; grouped[m].total += s.total; grouped[m].paid += s.paid; });
      const rows = Object.values(grouped).sort((a, b) => b.month.localeCompare(a.month));
      return (
        <div className="table-wrap"><div className="table-header"><h3>Monthly Sales Report</h3></div>
          <div className="table-scroll"><table>
            <thead><tr><th>Month</th><th>Invoices</th><th>Total Sales</th><th>Collected</th><th>Outstanding</th></tr></thead>
            <tbody>{rows.length ? rows.map(r => <tr key={r.month}><td className="mono">{r.month}</td><td>{r.count}</td><td className="mono">{fmt(r.total)}</td><td className="mono" style={{ color: 'var(--success)' }}>{fmt(r.paid)}</td><td className="mono" style={{ color: 'var(--danger)' }}>{fmt(r.total - r.paid)}</td></tr>) : <tr><td colSpan={5} className="empty"><p>No data</p></td></tr>}</tbody>
          </table></div>
        </div>
      );
    }
    if (tab === 'profit') {
      let totalRevenue = 0, totalCost = 0; const byProduct = {};
      sales.forEach(s => s.items.forEach(item => {
        totalRevenue += item.total;
        const c = item.cost != null ? item.cost : (products.find(p => p.id === item.productId)?.cost || 0);
        const ic = c * item.qty; totalCost += ic;
        if (!byProduct[item.name]) byProduct[item.name] = { name: item.name, qty: 0, revenue: 0, cost: 0 };
        byProduct[item.name].qty += item.qty; byProduct[item.name].revenue += item.total; byProduct[item.name].cost += ic;
      }));
      const expTotal = expenses.reduce((a, e) => a + Number(e.amount || 0), 0);
      const gross = totalRevenue - totalCost; const net = gross - expTotal;
      const margin = totalRevenue > 0 ? (gross / totalRevenue * 100).toFixed(1) : 0;
      const prodRows = Object.values(byProduct).sort((a, b) => (b.revenue - b.cost) - (a.revenue - a.cost));
      return (
        <>
          <div className="cards-grid" style={{ marginBottom: 16 }}>
            <div className="card"><div className="card-label">Total Revenue</div><div className="card-value teal mono">{fmt(totalRevenue)}</div></div>
            <div className="card"><div className="card-label">Total Cost</div><div className="card-value red mono">{fmt(totalCost)}</div></div>
            <div className="card"><div className="card-label">Expenses</div><div className="card-value amber mono">{fmt(expTotal)}</div></div>
            <div className="card"><div className="card-label">Gross Profit</div><div className="card-value green mono">{fmt(gross)}</div></div>
            <div className="card"><div className="card-label">Net Profit</div><div className={`card-value ${net >= 0 ? 'green' : 'red'} mono`}>{fmt(net)}</div></div>
            <div className="card"><div className="card-label">Gross Margin</div><div className={`card-value ${+margin >= 20 ? 'green' : 'amber'} mono`}>{margin}%</div></div>
          </div>
          <div className="table-wrap"><div className="table-header"><h3>Profit by Product</h3></div>
            <div className="table-scroll"><table>
              <thead><tr><th>Product</th><th>Qty</th><th>Revenue</th><th>Cost</th><th>Profit</th><th>Margin</th></tr></thead>
              <tbody>{prodRows.length ? prodRows.map(r => { const p = r.revenue - r.cost; const m = r.revenue > 0 ? (p / r.revenue * 100).toFixed(1) : 0; return <tr key={r.name}><td>{r.name}</td><td>{r.qty}</td><td className="mono">{fmt(r.revenue)}</td><td className="mono">{fmt(r.cost)}</td><td className="mono" style={{ color: p >= 0 ? 'var(--success)' : 'var(--danger)' }}>{fmt(p)}</td><td><span className={`badge ${+m >= 20 ? 'badge-green' : 'badge-amber'}`}>{m}%</span></td></tr>; }) : <tr><td colSpan={6} className="empty"><p>No data</p></td></tr>}</tbody>
            </table></div>
          </div>
        </>
      );
    }
    if (tab === 'purchases') {
      const grouped = {};
      purchases.forEach(p => { const m = p.date.slice(0, 7); if (!grouped[m]) grouped[m] = { month: m, count: 0, total: 0, paid: 0 }; grouped[m].count++; grouped[m].total += p.total; grouped[m].paid += p.paid; });
      const rows = Object.values(grouped).sort((a, b) => b.month.localeCompare(a.month));
      return (
        <div className="table-wrap"><div className="table-header"><h3>Monthly Purchases</h3></div>
          <div className="table-scroll"><table>
            <thead><tr><th>Month</th><th>Entries</th><th>Total</th><th>Paid</th><th>Pending</th></tr></thead>
            <tbody>{rows.length ? rows.map(r => <tr key={r.month}><td className="mono">{r.month}</td><td>{r.count}</td><td className="mono">{fmt(r.total)}</td><td className="mono" style={{ color: 'var(--success)' }}>{fmt(r.paid)}</td><td className="mono" style={{ color: 'var(--warn)' }}>{fmt(r.total - r.paid)}</td></tr>) : <tr><td colSpan={5} className="empty"><p>No data</p></td></tr>}</tbody>
          </table></div>
        </div>
      );
    }
    if (tab === 'daily') {
      const days = {};
      sales.forEach(s => { days[s.date] = days[s.date] || { d: s.date, sales: 0, collected: 0, purchases: 0, paidOut: 0, expenses: 0 }; days[s.date].sales += s.total; days[s.date].collected += s.paid; });
      purchases.forEach(p => { days[p.date] = days[p.date] || { d: p.date, sales: 0, collected: 0, purchases: 0, paidOut: 0, expenses: 0 }; days[p.date].purchases += p.total; days[p.date].paidOut += p.paid; });
      expenses.forEach(e => { days[e.date] = days[e.date] || { d: e.date, sales: 0, collected: 0, purchases: 0, paidOut: 0, expenses: 0 }; days[e.date].expenses += Number(e.amount || 0); });
      const rows = Object.values(days).sort((a, b) => b.d.localeCompare(a.d));
      return (
        <div className="table-wrap"><div className="table-header"><h3>Daily Summary</h3></div>
          <div className="table-scroll"><table>
            <thead><tr><th>Date</th><th>Sales</th><th>Collected</th><th>Purchases</th><th>Paid Out</th><th>Expenses</th><th>Net Cash</th></tr></thead>
            <tbody>{rows.length ? rows.map(r => { const net = r.collected - r.paidOut - r.expenses; return <tr key={r.d}><td className="mono">{r.d}</td><td className="mono">{fmt(r.sales)}</td><td className="mono" style={{ color: 'var(--success)' }}>{fmt(r.collected)}</td><td className="mono">{fmt(r.purchases)}</td><td className="mono" style={{ color: 'var(--warn)' }}>{fmt(r.paidOut)}</td><td className="mono" style={{ color: 'var(--danger)' }}>{fmt(r.expenses)}</td><td className="mono" style={{ color: net >= 0 ? 'var(--success)' : 'var(--danger)' }}>{fmt(net)}</td></tr>; }) : <tr><td colSpan={7} className="empty"><p>No data</p></td></tr>}</tbody>
          </table></div>
        </div>
      );
    }
    if (tab === 'ar') {
      const cust = customersLedger.filter(c => c.balance > 0).sort((a, b) => b.balance - a.balance);
      const sup = suppliersLedger.filter(s => s.balance > 0).sort((a, b) => b.balance - a.balance);
      return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="table-wrap"><div className="table-header"><h3>Receivables ({fmt(cust.reduce((a, c) => a + c.balance, 0))})</h3></div>
            <div className="table-scroll"><table><thead><tr><th>Customer</th><th>Balance</th></tr></thead><tbody>{cust.length ? cust.map(c => <tr key={c.name}><td>{c.name}</td><td className="mono" style={{ color: 'var(--danger)' }}>{fmt(c.balance)}</td></tr>) : <tr><td colSpan={2} className="empty"><p>None</p></td></tr>}</tbody></table></div></div>
          <div className="table-wrap"><div className="table-header"><h3>Payables ({fmt(sup.reduce((a, s) => a + s.balance, 0))})</h3></div>
            <div className="table-scroll"><table><thead><tr><th>Supplier</th><th>Balance</th></tr></thead><tbody>{sup.length ? sup.map(s => <tr key={s.name}><td>{s.name}</td><td className="mono" style={{ color: 'var(--warn)' }}>{fmt(s.balance)}</td></tr>) : <tr><td colSpan={2} className="empty"><p>None</p></td></tr>}</tbody></table></div></div>
        </div>
      );
    }
    return null;
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <div className="tabs" style={{ flexWrap: 'wrap' }}>
          {[['sales', 'Sales'], ['profit', 'Profit'], ['purchases', 'Purchases'], ['daily', 'Daily Summary'], ['ar', 'Receivables/Payables']].map(([id, label]) => (
            <button key={id} className={`tab ${tab === id ? 'active' : ''}`} onClick={() => setTab(id)}>{label}</button>
          ))}
        </div>
        <div className="toolbar">
          <button className="btn btn-secondary btn-sm" onClick={() => exportReport('csv')}>CSV</button>
          <button className="btn btn-secondary btn-sm" onClick={() => exportReport('xlsx')}>Excel</button>
          <button className="btn btn-secondary btn-sm" onClick={() => exportReport('pdf')}>PDF</button>
        </div>
      </div>
      {renderPanel()}
    </div>
  );
}

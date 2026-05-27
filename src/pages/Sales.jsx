import { useState } from 'react';
import { useData } from '../context/DataContext';
import Badge from '../components/Badge';
import InvoiceModal from '../components/modals/InvoiceModal';
import DateRangeModal from '../components/modals/DateRangeModal';
import { IconEye, IconEdit, IconTrash } from '../components/Icons';
import { fmt, fmtN, today } from '../utils/helpers';
import { exportSales } from '../utils/export';

function InvoiceRow({ products, onRemove }) {
  const [productId, setProductId] = useState('');
  const [qty, setQty] = useState(1);
  const [price, setPrice] = useState(0);

  const handleProduct = pid => {
    setProductId(pid);
    const p = products.find(x => x.id === pid);
    if (p) setPrice(p.sale);
  };

  return { productId, qty, price, setProductId, handleProduct, setQty, setPrice };
}

function ItemRow({ products, onRemove, onChange, rowData }) {
  const handleProductChange = e => {
    const pid = e.target.value;
    const p = products.find(x => x.id === pid);
    onChange({ ...rowData, productId: pid, price: p ? p.sale : 0, name: p ? p.name : '' });
  };

  return (
    <div className="inv-item">
      <select value={rowData.productId} onChange={handleProductChange}>
        <option value="">— Select Product —</option>
        {products.map(p => <option key={p.id} value={p.id} data-stock={p.stock}>{p.name} (Stock: {p.stock})</option>)}
      </select>
      <input type="number" min="1" value={rowData.qty} onChange={e => onChange({ ...rowData, qty: +e.target.value || 1 })} className="inv-qty" />
      <input type="number" min="0" value={rowData.price} onChange={e => onChange({ ...rowData, price: +e.target.value || 0 })} className="inv-price" />
      <input readOnly value={fmtN(rowData.qty * rowData.price)} className="inv-line-total mono" style={{ color: 'var(--accent)', fontWeight: 600 }} />
      <button onClick={onRemove} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: 16, padding: 4 }}>✕</button>
    </div>
  );
}

export default function Sales({ onNavigate }) {
  const { sales, products, settings, activeSession, saveSale, deleteSale, updateSalePaid } = useData();
  const [tab, setTab] = useState('list');
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [viewSale, setViewSale] = useState(null);
  const [rangeOpen, setRangeOpen] = useState(false);

  // New invoice form state
  const [customer, setCustomer] = useState('');
  const [date, setDate] = useState(today());
  const [paid, setPaid] = useState(0);
  const [note, setNote] = useState('');
  const [items, setItems] = useState([{ id: 1, productId: '', name: '', qty: 1, price: 0, cost: 0 }]);
  const [nextId, setNextId] = useState(2);

  const initNewInvoice = () => {
    setCustomer(''); setPaid(0); setNote('');
    setDate(activeSession ? activeSession.date : today());
    setItems([{ id: 1, productId: '', name: '', qty: 1, price: 0, cost: 0 }]);
    setNextId(2);
  };

  const switchTab = t => { setTab(t); if (t === 'new') initNewInvoice(); };

  const addRow = () => {
    setItems(prev => [...prev, { id: nextId, productId: '', name: '', qty: 1, price: 0, cost: 0 }]);
    setNextId(n => n + 1);
  };

  const updateItem = (id, data) => setItems(prev => prev.map(r => r.id === id ? { ...r, ...data, name: products.find(p => p.id === data.productId)?.name || r.name } : r));
  const removeItem = id => setItems(prev => prev.filter(r => r.id !== id));

  const grandTotal = items.reduce((a, r) => a + r.qty * r.price, 0);

  const handleSave = () => {
    if (!activeSession) return alert('⚠️ No open day session!\n\nGo to: Balance Sheet → Open New Day');
    if (!customer.trim()) return alert('Customer name required');
    const validItems = items.filter(r => r.productId && r.qty > 0);
    if (!validItems.length) return alert('Add at least one item');
    for (const it of validItems) {
      const prod = products.find(p => p.id === it.productId);
      if (!prod) continue;
      if (it.qty > prod.stock) return alert(`Insufficient stock for ${prod.name}. Available: ${prod.stock}`);
    }
    const saleItems = validItems.map(r => {
      const p = products.find(x => x.id === r.productId);
      return { productId: r.productId, name: p.name, qty: r.qty, price: r.price, cost: p.cost, total: r.qty * r.price };
    });
    saveSale({ customer: customer.trim(), date, paid: parseFloat(paid) || 0, note }, saleItems);
    switchTab('list');
    alert('Invoice saved!');
  };

  const handleEditPaid = sale => {
    const v = prompt(`Update Amount Paid for ${sale.invoiceNo}\nTotal: ${fmt(sale.total)}\nCurrent Paid: ${fmt(sale.paid)}`, sale.paid);
    if (v == null) return;
    let np = parseFloat(v); if (isNaN(np) || np < 0) return alert('Invalid');
    updateSalePaid(sale.id, np);
  };

  const uniqueCustomers = [...new Set(sales.map(s => s.customer))];

  let rows = [...sales].reverse();
  if (search) rows = rows.filter(s => s.customer.toLowerCase().includes(search.toLowerCase()));
  if (dateFrom) rows = rows.filter(s => s.date >= dateFrom);
  if (dateTo) rows = rows.filter(s => s.date <= dateTo);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div className="tabs">
          <button className={`tab ${tab === 'list' ? 'active' : ''}`} onClick={() => switchTab('list')}>All Sales</button>
          <button className={`tab ${tab === 'new' ? 'active' : ''}`} onClick={() => switchTab('new')}>+ New Invoice</button>
        </div>
        <div className="toolbar">
          <button className="btn btn-secondary btn-sm" onClick={() => setRangeOpen(true)}>📤 Export</button>
        </div>
      </div>

      {tab === 'list' && (
        <div className="table-wrap">
          <div className="table-header">
            <h3>Sales Invoices</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ width: 140 }} title="From date" />
              <span style={{ fontSize: 12, color: 'var(--text3)' }}>→</span>
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ width: 140 }} title="To date" />
              <button className="btn btn-secondary btn-sm" onClick={() => { setDateFrom(''); setDateTo(''); }}>Clear</button>
              <div className="search-wrap">
                <input type="text" placeholder="Search customer…" value={search} onChange={e => setSearch(e.target.value)} style={{ width: 180 }} />
              </div>
            </div>
          </div>
          <div className="table-scroll">
            <table>
              <thead>
                <tr><th>#</th><th>Customer</th><th>Items</th><th>Total</th><th>Paid</th><th>Balance</th><th>Gross Profit</th><th>Status</th><th>Date</th><th></th></tr>
              </thead>
              <tbody>
                {rows.length ? rows.map((s, i) => {
                  let saleProfit = 0;
                  s.items.forEach(it => {
                    const c = it.cost != null ? it.cost : (products.find(p => p.id === it.productId)?.cost || 0);
                    saleProfit += (it.price - c) * it.qty;
                  });
                  const bal = s.total - s.paid;
                  return (
                    <tr key={s.id}>
                      <td className="mono" style={{ color: 'var(--text3)' }}>{s.invoiceNo || `INV-${String(i + 1).padStart(4, '0')}`}</td>
                      <td>{s.customer}</td>
                      <td>{s.items.length} item(s)</td>
                      <td className="mono">{fmtN(s.total)}</td>
                      <td className="mono" style={{ color: 'var(--success)' }}>{fmtN(s.paid)}</td>
                      <td className="mono" style={{ color: bal > 0 ? 'var(--danger)' : 'var(--success)' }}>{fmtN(bal)}</td>
                      <td className="mono" style={{ color: saleProfit >= 0 ? 'var(--success)' : 'var(--danger)' }}>{fmtN(saleProfit)}</td>
                      <td><Badge status={s.status} /></td>
                      <td style={{ color: 'var(--text3)', fontSize: 12 }}>{s.date}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button className="btn-icon" title="View" onClick={() => setViewSale(s)}><IconEye /></button>
                          <button className="btn-icon" title="Edit Paid" onClick={() => handleEditPaid(s)}><IconEdit /></button>
                          <button className="btn-icon" title="Delete" onClick={() => { if (confirm('Delete this sale and restore stock?')) deleteSale(s.id); }}><IconTrash /></button>
                        </div>
                      </td>
                    </tr>
                  );
                }) : <tr><td colSpan={10} className="empty"><p>No sales recorded yet</p></td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'new' && (
        <div className="card" style={{ maxWidth: 800 }}>
          {!activeSession && (
            <div className="alert alert-warn" style={{ marginBottom: 14 }}>
              ⚠️ <strong>No open day session.</strong> Go to <strong>Balance Sheet → Open New Day</strong> before saving an invoice.
            </div>
          )}
          <h3 style={{ marginBottom: 20, fontSize: 15 }}>New Sales Invoice</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Customer Name *</label>
              <input value={customer} onChange={e => setCustomer(e.target.value)} placeholder="e.g. Ali Medical Store" list="customers-list" />
              <datalist id="customers-list">{uniqueCustomers.map(c => <option key={c} value={c} />)}</datalist>
            </div>
            <div className="form-group">
              <label>Date</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} readOnly={!!activeSession} title={activeSession ? `Locked to session: ${activeSession.date}` : ''} />
            </div>
            <div className="form-group">
              <label>Amount Paid Now (PKR)</label>
              <input type="number" min="0" value={paid} onChange={e => setPaid(e.target.value)} />
              <small style={{ color: 'var(--text3)', fontSize: 11 }}>Status auto-calculated from Paid vs Total.</small>
            </div>
            <div className="form-group">
              <label>Notes</label>
              <input value={note} onChange={e => setNote(e.target.value)} placeholder="optional" />
            </div>
          </div>

          <div style={{ marginTop: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <label style={{ fontSize: 13, fontWeight: 600 }}>Invoice Items</label>
              <button className="btn btn-secondary btn-sm" onClick={addRow}>+ Add Row</button>
            </div>
            <div className="inv-item-header">
              <small style={{ color: 'var(--text3)' }}>Product</small>
              <small style={{ color: 'var(--text3)' }}>Qty</small>
              <small style={{ color: 'var(--text3)' }}>Unit Price</small>
              <small style={{ color: 'var(--text3)' }}>Total</small>
              <small />
            </div>
            <div id="invoice-items">
              {items.map(row => (
                <ItemRow
                  key={row.id}
                  products={products}
                  rowData={row}
                  onChange={data => updateItem(row.id, data)}
                  onRemove={() => removeItem(row.id)}
                />
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 13, color: 'var(--text2)' }}>Grand Total</div>
                <div className="mono" style={{ fontSize: 22, fontWeight: 700, color: 'var(--accent)' }}>PKR {fmtN(grandTotal)}</div>
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button className="btn btn-secondary" onClick={() => switchTab('list')}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave}>Save Invoice</button>
          </div>
        </div>
      )}

      <InvoiceModal open={!!viewSale} onClose={() => setViewSale(null)} sale={viewSale} settings={settings} />
      <DateRangeModal
        open={rangeOpen}
        onClose={() => setRangeOpen(false)}
        title="Export Sales (date range)"
        onExport={(fmt, from, to) => exportSales(fmt, sales, from, to)}
      />
    </div>
  );
}

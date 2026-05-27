import { useState } from 'react';
import { useData } from '../context/DataContext';
import Badge from '../components/Badge';
import DateRangeModal from '../components/modals/DateRangeModal';
import { IconEye, IconEdit, IconTrash } from '../components/Icons';
import { fmt, fmtN, today } from '../utils/helpers';
import { exportPurchases } from '../utils/export';

function PurchItemRow({ products, rowData, onChange, onRemove }) {
  const productNames = products.map(p => p.name);
  return (
    <div className="inv-item">
      <input type="text" placeholder="Product name" value={rowData.name} onChange={e => onChange({ ...rowData, name: e.target.value })} list="products-datalist" className="pr-name" />
      <input type="number" min="1" value={rowData.qty} onChange={e => onChange({ ...rowData, qty: +e.target.value || 1 })} className="pr-qty" />
      <input type="number" min="0" value={rowData.cost} onChange={e => onChange({ ...rowData, cost: +e.target.value || 0 })} className="pr-cost" />
      <input readOnly value={fmtN(rowData.qty * rowData.cost)} className="mono" style={{ color: 'var(--accent3)', fontWeight: 600, background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, padding: '9px 12px', fontSize: 13 }} />
      <button onClick={onRemove} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: 16, padding: 4 }}>✕</button>
    </div>
  );
}

export default function Purchases() {
  const { purchases, products, activeSession, savePurchase, deletePurchase, updatePurchasePaid } = useData();
  const [tab, setTab] = useState('list');
  const [search, setSearch] = useState('');
  const [rangeOpen, setRangeOpen] = useState(false);
  const [viewPurchase, setViewPurchase] = useState(null);

  const [supplier, setSupplier] = useState('');
  const [date, setDate] = useState(today());
  const [paid, setPaid] = useState(0);
  const [note, setNote] = useState('');
  const [items, setItems] = useState([{ id: 1, name: '', qty: 1, cost: 0 }]);
  const [nextId, setNextId] = useState(2);

  const initNewPurchase = () => {
    setSupplier(''); setPaid(0); setNote('');
    setDate(activeSession ? activeSession.date : today());
    setItems([{ id: 1, name: '', qty: 1, cost: 0 }]);
    setNextId(2);
  };

  const switchTab = t => { setTab(t); if (t === 'new') initNewPurchase(); };

  const addRow = () => { setItems(prev => [...prev, { id: nextId, name: '', qty: 1, cost: 0 }]); setNextId(n => n + 1); };
  const updateItem = (id, data) => setItems(prev => prev.map(r => r.id === id ? data : r));
  const removeItem = id => setItems(prev => prev.filter(r => r.id !== id));

  const total = items.reduce((a, r) => a + r.qty * r.cost, 0);

  const handleSave = () => {
    if (!activeSession) return alert('⚠️ No open day session!\n\nGo to: Balance Sheet → Open New Day');
    if (!supplier.trim()) return alert('Supplier required');
    const valid = items.filter(r => r.name.trim() && r.qty > 0);
    if (!valid.length) return alert('Add at least one item');
    savePurchase({ supplier: supplier.trim(), date, paid: parseFloat(paid) || 0, note }, valid.map(r => ({ name: r.name.trim(), qty: r.qty, cost: r.cost, total: r.qty * r.cost })));
    switchTab('list');
    alert('Purchase saved!');
  };

  const handleEditPaid = p => {
    const v = prompt(`Update Amount Paid\nTotal: ${fmt(p.total)}\nCurrent: ${fmt(p.paid)}`, p.paid);
    if (v == null) return;
    const np = parseFloat(v); if (isNaN(np) || np < 0) return alert('Invalid');
    updatePurchasePaid(p.id, np);
  };

  const uniqueSuppliers = [...new Set(purchases.map(p => p.supplier))];
  const rows = [...purchases].reverse().filter(p => !search || p.supplier.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div className="tabs">
          <button className={`tab ${tab === 'list' ? 'active' : ''}`} onClick={() => switchTab('list')}>All Purchases</button>
          <button className={`tab ${tab === 'new' ? 'active' : ''}`} onClick={() => switchTab('new')}>+ New Purchase</button>
        </div>
        <div className="toolbar">
          <button className="btn btn-secondary btn-sm" onClick={() => setRangeOpen(true)}>📤 Export</button>
        </div>
      </div>

      {tab === 'list' && (
        <div className="table-wrap">
          <div className="table-header">
            <h3>Purchase Records</h3>
            <div className="search-wrap">
              <input type="text" placeholder="Search supplier…" value={search} onChange={e => setSearch(e.target.value)} style={{ width: 180 }} />
            </div>
          </div>
          <div className="table-scroll">
            <table>
              <thead>
                <tr><th>#</th><th>Supplier</th><th>Items</th><th>Total Cost</th><th>Paid</th><th>Balance</th><th>Status</th><th>Date</th><th></th></tr>
              </thead>
              <tbody>
                {rows.length ? rows.map((p, i) => {
                  const bal = p.total - p.paid;
                  return (
                    <tr key={p.id}>
                      <td className="mono" style={{ color: 'var(--text3)' }}>{p.purchaseNo || `PUR-${String(rows.length - i).padStart(4, '0')}`}</td>
                      <td>{p.supplier}</td>
                      <td>{p.items.length} item(s)</td>
                      <td className="mono">{fmt(p.total)}</td>
                      <td className="mono" style={{ color: 'var(--success)' }}>{fmt(p.paid)}</td>
                      <td className="mono" style={{ color: bal > 0 ? 'var(--warn)' : 'var(--success)' }}>{fmt(bal)}</td>
                      <td><Badge status={p.status} /></td>
                      <td style={{ color: 'var(--text3)', fontSize: 12 }}>{p.date}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button className="btn-icon" title="View" onClick={() => setViewPurchase(p)}><IconEye /></button>
                          <button className="btn-icon" title="Edit Paid" onClick={() => handleEditPaid(p)}><IconEdit /></button>
                          <button className="btn-icon" title="Delete" onClick={() => { if (confirm('Delete this purchase and reverse stock?')) deletePurchase(p.id); }}><IconTrash /></button>
                        </div>
                      </td>
                    </tr>
                  );
                }) : <tr><td colSpan={9} className="empty"><p>No purchases recorded yet</p></td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'new' && (
        <div className="card" style={{ maxWidth: 800 }}>
          {!activeSession && (
            <div className="alert alert-warn" style={{ marginBottom: 14 }}>
              ⚠️ <strong>No open day session.</strong> Go to <strong>Balance Sheet → Open New Day</strong> before saving.
            </div>
          )}
          <h3 style={{ marginBottom: 20, fontSize: 15 }}>New Purchase Entry</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Supplier Name *</label>
              <input value={supplier} onChange={e => setSupplier(e.target.value)} placeholder="e.g. Medline Traders" list="suppliers-list" />
              <datalist id="suppliers-list">{uniqueSuppliers.map(s => <option key={s} value={s} />)}</datalist>
            </div>
            <div className="form-group">
              <label>Date</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} readOnly={!!activeSession} />
            </div>
            <div className="form-group">
              <label>Amount Paid Now (PKR)</label>
              <input type="number" min="0" value={paid} onChange={e => setPaid(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Notes</label>
              <input value={note} onChange={e => setNote(e.target.value)} placeholder="optional" />
            </div>
          </div>
          <datalist id="products-datalist">{products.map(p => <option key={p.id} value={p.name} />)}</datalist>
          <div style={{ marginTop: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <label style={{ fontSize: 13, fontWeight: 600 }}>Purchase Items</label>
              <button className="btn btn-secondary btn-sm" onClick={addRow}>+ Add Row</button>
            </div>
            <div className="inv-item-header">
              <small style={{ color: 'var(--text3)' }}>Product</small>
              <small style={{ color: 'var(--text3)' }}>Qty</small>
              <small style={{ color: 'var(--text3)' }}>Cost/Unit</small>
              <small style={{ color: 'var(--text3)' }}>Total</small>
              <small />
            </div>
            {items.map(row => (
              <PurchItemRow key={row.id} products={products} rowData={row} onChange={data => updateItem(row.id, data)} onRemove={() => removeItem(row.id)} />
            ))}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 13, color: 'var(--text2)' }}>Total Cost</div>
                <div className="mono" style={{ fontSize: 22, fontWeight: 700, color: 'var(--accent3)' }}>PKR {fmtN(total)}</div>
              </div>
            </div>
          </div>
          <div className="form-actions">
            <button className="btn btn-secondary" onClick={() => switchTab('list')}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave}>Save Purchase</button>
          </div>
        </div>
      )}

      {/* Purchase detail modal */}
      {viewPurchase && (
        <div className="modal-overlay open" onClick={e => { if (e.target === e.currentTarget) setViewPurchase(null); }}>
          <div className="modal" style={{ maxWidth: 680 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Purchase {viewPurchase.purchaseNo || viewPurchase.id}</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 13, marginBottom: 14 }}>
              <div><div style={{ color: 'var(--text3)', fontSize: 11 }}>SUPPLIER</div><div>{viewPurchase.supplier}</div></div>
              <div><div style={{ color: 'var(--text3)', fontSize: 11 }}>DATE</div><div>{viewPurchase.date}</div></div>
              <div><div style={{ color: 'var(--text3)', fontSize: 11 }}>STATUS</div><div><Badge status={viewPurchase.status} /></div></div>
              <div><div style={{ color: 'var(--text3)', fontSize: 11 }}>BALANCE</div><div className="mono" style={{ color: viewPurchase.total - viewPurchase.paid > 0 ? 'var(--warn)' : 'var(--success)' }}>{fmt(viewPurchase.total - viewPurchase.paid)}</div></div>
            </div>
            <div className="table-scroll">
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, marginBottom: 12 }}>
                <thead><tr style={{ background: 'var(--surface2)' }}><th style={{ padding: 8, textAlign: 'left' }}>Product</th><th style={{ padding: 8, textAlign: 'right' }}>Qty</th><th style={{ padding: 8, textAlign: 'right' }}>Cost</th><th style={{ padding: 8, textAlign: 'right' }}>Total</th></tr></thead>
                <tbody>{viewPurchase.items.map((it, i) => <tr key={i}><td style={{ padding: '7px 8px', borderTop: '1px solid var(--border)' }}>{it.name}</td><td style={{ padding: '7px 8px', textAlign: 'right', borderTop: '1px solid var(--border)' }}>{it.qty}</td><td style={{ padding: '7px 8px', textAlign: 'right', borderTop: '1px solid var(--border)' }}>{fmt(it.cost)}</td><td style={{ padding: '7px 8px', textAlign: 'right', borderTop: '1px solid var(--border)' }}>{fmt(it.total)}</td></tr>)}</tbody>
              </table>
            </div>
            <div style={{ textAlign: 'right', fontSize: 13 }}>
              <div>Total: <strong className="mono">{fmt(viewPurchase.total)}</strong></div>
              <div style={{ color: 'var(--success)' }}>Paid: <strong className="mono">{fmt(viewPurchase.paid)}</strong></div>
            </div>
            {viewPurchase.note && <p style={{ marginTop: 10, fontSize: 12, color: 'var(--text2)' }}>Note: {viewPurchase.note}</p>}
            <div className="form-actions"><button className="btn btn-secondary" onClick={() => setViewPurchase(null)}>Close</button></div>
          </div>
        </div>
      )}

      <DateRangeModal open={rangeOpen} onClose={() => setRangeOpen(false)} title="Export Purchases (date range)" onExport={(f, from, to) => exportPurchases(f, purchases, from, to)} />
    </div>
  );
}

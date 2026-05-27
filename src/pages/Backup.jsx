import { useRef } from 'react';
import { useData } from '../context/DataContext';
import { today } from '../utils/helpers';
import { downloadBlob, exportSales, exportPurchases, exportInventory, exportLedger, exportPayments } from '../utils/export';

export default function Backup() {
  const { settings, sales, purchases, payments, products, expenses, updateSettings, getFullBackup, restoreFromBackup, wipeAllData } = useData();
  const fileRef = useRef();

  const handleDownload = () => {
    const data = getFullBackup();
    downloadBlob(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }), `ammar_surgical_backup_${today()}.json`);
    updateSettings({ lastBackup: new Date().toISOString() });
  };

  const handleRestore = e => {
    const f = e.target.files[0];
    if (!f) return;
    if (!confirm('Restore will OVERWRITE current data. Continue?')) return;
    const r = new FileReader();
    r.onload = ev => {
      try {
        const d = JSON.parse(ev.target.result);
        restoreFromBackup(d);
        alert('Restored successfully');
      } catch {
        alert('Invalid backup file');
      }
    };
    r.readAsText(f);
    e.target.value = '';
  };

  const bizName = settings?.businessName || '';
  const bizSub = settings?.businessSub || '';
  const address = settings?.address || '';
  const phone = settings?.phone || '';

  const lastBackup = settings?.lastBackup ? 'Last backup: ' + new Date(settings.lastBackup).toLocaleString() : 'No backup yet';

  return (
    <div>
      {/* Business Info */}
      <div className="table-wrap" style={{ marginBottom: 20 }}>
        <div className="table-header"><h3>🏢 Business Information</h3></div>
        <div style={{ padding: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Business Name</label>
            <input value={bizName} onChange={e => updateSettings({ businessName: e.target.value.trim() || 'Ammar Surgical & Diagnostic' })} style={{ width: '100%' }} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Tagline / Sub-title</label>
            <input value={bizSub} onChange={e => updateSettings({ businessSub: e.target.value.trim() || 'Diagnostic & Wholesale Suite' })} style={{ width: '100%' }} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Address</label>
            <input value={address} onChange={e => updateSettings({ address: e.target.value })} style={{ width: '100%' }} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Phone</label>
            <input value={phone} onChange={e => updateSettings({ phone: e.target.value })} style={{ width: '100%' }} />
          </div>
        </div>
      </div>

      <div className="cards-grid">
        <div className="card">
          <div className="card-label">Full Database Backup</div>
          <p style={{ fontSize: 13, color: 'var(--text2)', margin: '8px 0 14px' }}>Download a single JSON file with ALL your data. Use this for safe-keeping or moving to another browser.</p>
          <div className="toolbar">
            <button className="btn btn-primary btn-sm" onClick={handleDownload}>⬇ Download Backup</button>
            <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer' }}>
              ⬆ Restore
              <input type="file" accept="application/json" style={{ display: 'none' }} onChange={handleRestore} ref={fileRef} />
            </label>
          </div>
        </div>
        <div className="card">
          <div className="card-label">Auto Backup</div>
          <p style={{ fontSize: 13, color: 'var(--text2)', margin: '8px 0 14px' }}>Automatically download a backup file every day on first visit.</p>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
            <input type="checkbox" checked={!!settings?.autoBackup} onChange={e => updateSettings({ autoBackup: e.target.checked })} style={{ width: 'auto' }} />
            Enable daily auto-backup
          </label>
          <small style={{ display: 'block', marginTop: 8, color: 'var(--text3)' }}>{lastBackup}</small>
        </div>
        <div className="card">
          <div className="card-label">Danger Zone</div>
          <p style={{ fontSize: 13, color: 'var(--text2)', margin: '8px 0 14px' }}>Wipe all data. Make a backup first!</p>
          <button className="btn btn-danger btn-sm" onClick={() => { if (!confirm('This will DELETE ALL DATA. Are you absolutely sure?')) return; if (!confirm('Final confirmation: ERASE everything?')) return; wipeAllData(); }}>🗑 Reset Database</button>
        </div>
      </div>

      <div className="table-wrap" style={{ marginTop: 16 }}>
        <div className="table-header"><h3>Module-by-Module Export</h3></div>
        <div className="table-scroll">
          <table>
            <thead><tr><th>Module</th><th>CSV</th><th>Excel</th><th>PDF</th></tr></thead>
            <tbody>
              {[
                ['All Sales', () => exportSales('csv', sales), () => exportSales('xlsx', sales), () => exportSales('pdf', sales)],
                ['All Purchases', () => exportPurchases('csv', purchases), () => exportPurchases('xlsx', purchases), () => exportPurchases('pdf', purchases)],
                ['Inventory', () => exportInventory('csv', products), () => exportInventory('xlsx', products), () => exportInventory('pdf', products)],
                ['Low Stock Only', () => exportInventory('csv', products, true), () => exportInventory('xlsx', products, true), () => exportInventory('pdf', products, true)],
                ['Customer Ledger', () => exportLedger('csv', 'customer', sales, purchases, payments), () => exportLedger('xlsx', 'customer', sales, purchases, payments), () => exportLedger('pdf', 'customer', sales, purchases, payments)],
                ['Supplier Ledger', () => exportLedger('csv', 'supplier', sales, purchases, payments), () => exportLedger('xlsx', 'supplier', sales, purchases, payments), () => exportLedger('pdf', 'supplier', sales, purchases, payments)],
                ['Payment History', () => exportPayments('csv', payments), () => exportPayments('xlsx', payments), () => exportPayments('pdf', payments)],
              ].map(([label, csv, xlsx, pdf]) => (
                <tr key={label}>
                  <td>{label}</td>
                  <td><button className="btn-icon" onClick={csv} title="CSV">📄</button></td>
                  <td><button className="btn-icon" onClick={xlsx} title="Excel">📊</button></td>
                  <td><button className="btn-icon" onClick={pdf} title="PDF">📕</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

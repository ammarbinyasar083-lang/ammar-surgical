import Modal from '../Modal';
import Badge from '../Badge';
import { fmt } from '../../utils/helpers';
import { exportInvoicePdf } from '../../utils/export';

export default function InvoiceModal({ open, onClose, sale, settings }) {
  if (!sale) return null;
  const balance = sale.total - sale.paid;
  return (
    <Modal open={open} onClose={onClose} maxWidth={620}>
      <div style={{ fontFamily: "'Sora', sans-serif", padding: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, borderBottom: '2px solid var(--border)', paddingBottom: 14 }}>
          <div>
            <h2 style={{ color: 'var(--accent)', fontSize: 18 }}>⚕ {settings?.businessName || 'AMMAR SURGICAL'}</h2>
            <p style={{ fontSize: 11, color: 'var(--text2)' }}>{settings?.address || 'Diagnostic & Surgical Wholesale'}</p>
            {settings?.phone && <p style={{ fontSize: 11, color: 'var(--text2)' }}>Tel: {settings.phone}</p>}
          </div>
          <div style={{ textAlign: 'right' }}>
            <h3 style={{ fontSize: 14 }}>INVOICE</h3>
            <p style={{ fontSize: 12, color: 'var(--text2)' }}>{sale.invoiceNo || sale.id}</p>
            <p style={{ fontSize: 12, color: 'var(--text2)' }}>Date: {sale.date}</p>
          </div>
        </div>
        <div style={{ marginBottom: 14 }}>
          <p style={{ fontSize: 13, fontWeight: 600 }}>Bill To: <span style={{ color: 'var(--accent2)' }}>{sale.customer}</span></p>
          <p style={{ fontSize: 12, marginTop: 4 }}>Status: <Badge status={sale.status} /></p>
        </div>
        <div className="table-scroll">
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 14, fontSize: 12 }}>
            <thead>
              <tr style={{ background: 'var(--surface2)' }}>
                {['Product', 'Qty', 'Price', 'Total'].map(h => (
                  <th key={h} style={{ padding: '8px', textAlign: h === 'Product' ? 'left' : 'right', borderBottom: '1px solid var(--border)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sale.items.map((item, i) => (
                <tr key={i}>
                  <td style={{ padding: '7px 8px', borderBottom: '1px solid var(--border)' }}>{item.name}</td>
                  <td style={{ padding: '7px 8px', textAlign: 'right', borderBottom: '1px solid var(--border)' }}>{item.qty}</td>
                  <td style={{ padding: '7px 8px', textAlign: 'right', borderBottom: '1px solid var(--border)' }}>{fmt(item.price)}</td>
                  <td style={{ padding: '7px 8px', textAlign: 'right', borderBottom: '1px solid var(--border)' }}>{fmt(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ textAlign: 'right', fontSize: 13 }}>
          <div>Total: <strong className="mono">{fmt(sale.total)}</strong></div>
          <div style={{ color: 'var(--success)' }}>Paid: <strong className="mono">{fmt(sale.paid)}</strong></div>
          {balance > 0 && <div style={{ color: 'var(--danger)' }}>Balance: <strong className="mono">{fmt(balance)}</strong></div>}
        </div>
        {sale.note && <p style={{ marginTop: 12, fontSize: 12, color: 'var(--text2)' }}>Note: {sale.note}</p>}
        <div style={{ marginTop: 20, fontSize: 11, color: 'var(--text3)', textAlign: 'center' }}>Thank you for your business!</div>
      </div>
      <div className="form-actions no-print">
        <button className="btn btn-secondary" onClick={onClose}>Close</button>
        <button className="btn btn-secondary" onClick={() => exportInvoicePdf(sale, settings)}>⬇ PDF</button>
        <button className="btn btn-primary" onClick={() => window.print()}>🖨 Print</button>
      </div>
    </Modal>
  );
}

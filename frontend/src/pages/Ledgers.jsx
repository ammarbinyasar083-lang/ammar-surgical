import { useState } from 'react';
import { useData } from '../context/DataContext';
import Badge from '../components/Badge';
import PaymentModal from '../components/modals/PaymentModal';
import { IconEye, IconEdit, IconTrash } from '../components/Icons';
import { fmt } from '../utils/helpers';
import { exportLedger } from '../utils/export';

function PartyDetail({ party, type, onClose }) {
  if (!party) return null;
  return (
    <div className="modal-overlay open" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" style={{ maxWidth: 680 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>{party.name}</h2>
        <p style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 14 }}>{type === 'customer' ? 'Customer' : 'Supplier'} ledger</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 14 }}>
          <div className="card"><div className="card-label">Debit</div><div className="card-value mono" style={{ fontSize: 18 }}>{fmt(party.totalDebit)}</div></div>
          <div className="card"><div className="card-label">Credit</div><div className="card-value green mono" style={{ fontSize: 18 }}>{fmt(party.totalCredit)}</div></div>
          <div className="card"><div className="card-label">Balance</div><div className={`card-value ${party.balance > 0 ? 'red' : 'green'} mono`} style={{ fontSize: 18 }}>{fmt(party.balance)}</div></div>
        </div>
        <div className="table-scroll">
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: 'var(--surface2)' }}>
                <th style={{ padding: 8, textAlign: 'left' }}>Date</th>
                <th style={{ padding: 8, textAlign: 'left' }}>Description</th>
                <th style={{ padding: 8, textAlign: 'right' }}>Dr</th>
                <th style={{ padding: 8, textAlign: 'right' }}>Cr</th>
              </tr>
            </thead>
            <tbody>
              {party.transactions.map((t, i) => (
                <tr key={i}>
                  <td style={{ padding: '7px 8px', borderTop: '1px solid var(--border)' }}>{t.date}</td>
                  <td style={{ padding: '7px 8px', borderTop: '1px solid var(--border)' }}>{t.desc}</td>
                  <td style={{ padding: '7px 8px', textAlign: 'right', borderTop: '1px solid var(--border)' }}>{t.debit ? fmt(t.debit) : ''}</td>
                  <td style={{ padding: '7px 8px', textAlign: 'right', borderTop: '1px solid var(--border)', color: 'var(--success)' }}>{t.credit ? fmt(t.credit) : t.displayAmount ? fmt(t.displayAmount) : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="form-actions"><button className="btn btn-secondary" onClick={onClose}>Close</button></div>
      </div>
    </div>
  );
}

export default function Ledgers() {
  const { customersLedger, suppliersLedger, sales, purchases, payments, activeSession, savePayment, deletePayment } = useData();
  const [ledgerTab, setLedgerTab] = useState('customers');
  const [payModal, setPayModal] = useState(null); // { type, party, balance, editPayment }
  const [detailParty, setDetailParty] = useState(null);
  const [detailType, setDetailType] = useState('customer');

  const isCustomer = ledgerTab === 'customers';
  const data = isCustomer ? customersLedger : suppliersLedger;
  const totalBalance = data.reduce((a, c) => a + Math.max(0, c.balance), 0);

  const openPayment = (type, name, balance) => {
    setPayModal({ type, party: name, balance, editPayment: null });
  };

  const openEditPayment = payId => {
    const pay = payments.find(p => p.id === payId);
    if (!pay) return;
    setPayModal({ type: pay.type, party: pay.party, balance: null, editPayment: pay });
  };

  const handleSavePayment = (data, editingId) => {
    if (!activeSession) return alert('⚠️ No open day session!\n\nGo to: Balance Sheet → Open New Day');
    savePayment(data, editingId);
  };

  const handleDeletePayment = id => {
    if (!confirm('Delete this payment? Invoice/purchase balances will recalculate.')) return;
    deletePayment(id);
  };

  const openDetail = (type, name) => {
    const d = type === 'customer' ? customersLedger : suppliersLedger;
    const party = d.find(x => x.name === name);
    setDetailParty(party); setDetailType(type);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <div className="tabs">
          <button className={`tab ${ledgerTab === 'customers' ? 'active' : ''}`} onClick={() => setLedgerTab('customers')}>Customers Ledger</button>
          <button className={`tab ${ledgerTab === 'suppliers' ? 'active' : ''}`} onClick={() => setLedgerTab('suppliers')}>Suppliers Ledger</button>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={() => exportLedger('xlsx', isCustomer ? 'customer' : 'supplier', sales, purchases, payments)}>📤 Export Ledger</button>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <div className="card" style={{ flex: 1, minWidth: 160 }}>
          <div className="card-label">{isCustomer ? 'Total Receivable' : 'Total Payable'}</div>
          <div className={`card-value ${isCustomer ? 'blue' : 'amber'} mono`}>{fmt(totalBalance)}</div>
        </div>
        <div className="card" style={{ flex: 1, minWidth: 160 }}>
          <div className="card-label">{isCustomer ? 'Customers' : 'Suppliers'}</div>
          <div className="card-value mono">{data.length}</div>
        </div>
      </div>

      {!data.length ? (
        <div className="empty"><p>No {isCustomer ? 'customer' : 'supplier'} records yet.</p></div>
      ) : (
        data.map(c => (
          <div key={c.name} className="ledger-card">
            <div className="ledger-card-header">
              <div>
                <h4>{c.name}</h4>
                <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>
                  {isCustomer ? 'Sales' : 'Purchased'}: <span className="mono">{fmt(c.totalDebit)}</span>
                  &nbsp;|&nbsp;
                  {isCustomer ? 'Collected' : 'Paid'}: <span className="mono" style={{ color: 'var(--success)' }}>{fmt(c.totalCredit)}</span>
                  &nbsp;|&nbsp;
                  Balance: <span className="mono" style={{ color: c.balance > 0 ? (isCustomer ? 'var(--danger)' : 'var(--warn)') : 'var(--success)' }}>{fmt(c.balance)}</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <button className="btn-icon" title="View detail" onClick={() => openDetail(isCustomer ? 'customer' : 'supplier', c.name)}><IconEye /></button>
                {c.balance > 0 && (
                  <button className={`btn ${isCustomer ? 'btn-primary' : 'btn-secondary'} btn-sm`} onClick={() => openPayment(isCustomer ? 'customer' : 'supplier', c.name, c.balance)}>
                    {isCustomer ? 'Record Payment' : 'Pay'}
                  </button>
                )}
              </div>
            </div>
            <div className="ledger-timeline">
              {[...c.transactions].reverse().map((t, i) => (
                <div key={i} className={`ledger-entry ${t.kind === 'payment' ? 'payment' : 'invoice'}`}>
                  <div>
                    <strong>{t.date}</strong> — {t.desc}
                    {t.debit ? <span style={{ color: 'var(--accent2)' }}> Dr: {fmt(t.debit)}</span> : null}
                    {t.credit ? <span style={{ color: 'var(--success)' }}> Cr: {fmt(t.credit)}</span>
                      : t.displayAmount ? <span style={{ color: 'var(--success)' }}> Cr: {fmt(t.displayAmount)}</span> : null}
                    {t.status ? <> <Badge status={t.status} /></> : null}
                  </div>
                  <div className="ledger-entry-actions">
                    {t.kind === 'payment' ? (
                      <>
                        <button className="btn-icon" title="Edit" onClick={() => openEditPayment(t.ref)}><IconEdit /></button>
                        <button className="btn-icon" title="Delete" onClick={() => handleDeletePayment(t.ref)}><IconTrash /></button>
                      </>
                    ) : (
                      <button className="btn-icon" title="View" onClick={() => openDetail(isCustomer ? 'customer' : 'supplier', c.name)}><IconEye /></button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      <PaymentModal
        open={!!payModal}
        onClose={() => setPayModal(null)}
        onSave={handleSavePayment}
        type={payModal?.type}
        party={payModal?.party}
        balance={payModal?.balance}
        editPayment={payModal?.editPayment}
      />

      <PartyDetail
        party={detailParty}
        type={detailType}
        onClose={() => setDetailParty(null)}
      />
    </div>
  );
}

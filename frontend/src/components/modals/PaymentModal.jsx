import { useState, useEffect } from 'react';
import Modal from '../Modal';
import { today, fmt } from '../../utils/helpers';

export default function PaymentModal({ open, onClose, onSave, type, party, balance, editPayment = null }) {
  const [form, setForm] = useState({ amount: '', date: today(), note: '' });

  useEffect(() => {
    if (!open) return;
    if (editPayment) {
      setForm({ amount: editPayment.amount, date: editPayment.date, note: editPayment.note || '' });
    } else {
      setForm({ amount: balance || '', date: today(), note: '' });
    }
  }, [open, editPayment, balance]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = () => {
    const amount = parseFloat(form.amount);
    if (!amount || amount <= 0) return alert('Enter valid amount');
    onSave({ type, party, amount, date: form.date || today(), note: form.note }, editPayment?.id || null);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} maxWidth={460}>
      <h2>{editPayment ? 'Edit Payment' : 'Record Payment'}</h2>
      <div className="form-grid single">
        <div className="form-group">
          <label>Party Name</label>
          <input value={party || ''} readOnly />
        </div>
        {!editPayment && (
          <div className="form-group">
            <label>Outstanding Balance (PKR)</label>
            <input value={balance != null ? fmt(balance) : '—'} readOnly />
          </div>
        )}
        <div className="form-group">
          <label>Payment Amount (PKR) *</label>
          <input type="number" min="0.01" value={form.amount} onChange={e => set('amount', e.target.value)} />
        </div>
        <div className="form-group">
          <label>Date *</label>
          <input type="date" value={form.date} onChange={e => set('date', e.target.value)} />
        </div>
        <div className="form-group">
          <label>Reference / Note</label>
          <input value={form.note} onChange={e => set('note', e.target.value)} placeholder="e.g. Cash, Cheque #123" />
        </div>
      </div>
      <div className="form-actions">
        <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" onClick={handleSave}>Save Payment</button>
      </div>
    </Modal>
  );
}

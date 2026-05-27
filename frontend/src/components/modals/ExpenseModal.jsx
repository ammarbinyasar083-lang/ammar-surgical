import { useState, useEffect } from 'react';
import Modal from '../Modal';
import { today } from '../../utils/helpers';

const EMPTY = { date: today(), category: '', desc: '', amount: '' };

export default function ExpenseModal({ open, onClose, onSave, editExpense = null }) {
  const [form, setForm] = useState(EMPTY);

  useEffect(() => {
    if (!open) return;
    setForm(editExpense
      ? { date: editExpense.date, category: editExpense.category || '', desc: editExpense.desc || '', amount: editExpense.amount }
      : { ...EMPTY, date: today() }
    );
  }, [open, editExpense]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = () => {
    const amount = parseFloat(form.amount);
    if (!amount || amount <= 0) return alert('Amount required');
    onSave({ date: form.date || today(), category: form.category, desc: form.desc, amount }, editExpense?.id || null);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} maxWidth={460}>
      <h2>{editExpense ? 'Edit Expense' : 'Add Expense'}</h2>
      <div className="form-grid">
        <div className="form-group">
          <label>Date</label>
          <input type="date" value={form.date} onChange={e => set('date', e.target.value)} />
        </div>
        <div className="form-group">
          <label>Category</label>
          <input value={form.category} onChange={e => set('category', e.target.value)} placeholder="e.g. Utilities, Salary" />
        </div>
        <div className="form-group full">
          <label>Description</label>
          <input value={form.desc} onChange={e => set('desc', e.target.value)} />
        </div>
        <div className="form-group">
          <label>Amount (PKR) *</label>
          <input type="number" min="0" value={form.amount} onChange={e => set('amount', e.target.value)} />
        </div>
      </div>
      <div className="form-actions">
        <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" onClick={handleSave}>Save</button>
      </div>
    </Modal>
  );
}

import { useState } from 'react';
import { useData } from '../context/DataContext';
import ExpenseModal from '../components/modals/ExpenseModal';
import { IconEdit, IconTrash } from '../components/Icons';
import { fmt } from '../utils/helpers';
import { exportExpenses } from '../utils/export';

export default function Expenses() {
  const { expenses, activeSession, saveExpense, deleteExpense } = useData();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);

  const openAdd = () => { setEditingExpense(null); setModalOpen(true); };
  const openEdit = e => { setEditingExpense(e); setModalOpen(true); };

  const handleSave = (data, editingId) => {
    if (!activeSession) return alert('⚠️ No open day session!\n\nGo to: Balance Sheet → Open New Day');
    saveExpense(data, editingId);
    setModalOpen(false);
  };

  const sorted = [...expenses].reverse();

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <h3 style={{ fontSize: 15 }}>Expenses</h3>
        <div className="toolbar">
          <button className="btn btn-secondary btn-sm" onClick={() => exportExpenses('csv', expenses)}>CSV</button>
          <button className="btn btn-secondary btn-sm" onClick={() => exportExpenses('xlsx', expenses)}>Excel</button>
          <button className="btn btn-primary btn-sm" onClick={openAdd}>+ Add Expense</button>
        </div>
      </div>
      <div className="table-wrap">
        <div className="table-scroll">
          <table>
            <thead><tr><th>Date</th><th>Category</th><th>Description</th><th>Amount</th><th></th></tr></thead>
            <tbody>
              {sorted.length ? sorted.map(e => (
                <tr key={e.id}>
                  <td>{e.date}</td>
                  <td>{e.category || ''}</td>
                  <td>{e.desc || ''}</td>
                  <td className="mono">{fmt(e.amount)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="btn-icon" onClick={() => openEdit(e)} title="Edit"><IconEdit /></button>
                      <button className="btn-icon" onClick={() => { if (confirm('Delete this expense?')) deleteExpense(e.id); }} title="Delete"><IconTrash /></button>
                    </div>
                  </td>
                </tr>
              )) : <tr><td colSpan={5} className="empty"><p>No expenses yet</p></td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <ExpenseModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        editExpense={editingExpense}
      />
    </div>
  );
}

import { useState } from 'react';
import Modal from '../Modal';
import { today } from '../../utils/helpers';

export default function DateRangeModal({ open, onClose, title, onExport }) {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState(today());
  const [fmt, setFmt] = useState('xlsx');

  const handleExport = () => {
    onExport(fmt, from || null, to || null);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} maxWidth={420}>
      <h2>{title || 'Export with Date Range'}</h2>
      <div className="form-grid">
        <div className="form-group">
          <label>From</label>
          <input type="date" value={from} onChange={e => setFrom(e.target.value)} />
        </div>
        <div className="form-group">
          <label>To</label>
          <input type="date" value={to} onChange={e => setTo(e.target.value)} />
        </div>
        <div className="form-group full">
          <label>Format</label>
          <select value={fmt} onChange={e => setFmt(e.target.value)}>
            <option value="csv">CSV</option>
            <option value="xlsx">Excel</option>
            <option value="pdf">PDF</option>
          </select>
        </div>
      </div>
      <div className="form-actions">
        <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" onClick={handleExport}>Export</button>
      </div>
    </Modal>
  );
}

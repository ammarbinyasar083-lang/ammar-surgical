import { useState, useEffect } from 'react';
import Modal from '../Modal';

const EMPTY = { name: '', stock: 0, minStock: 10, cost: 0, sale: 0 };

export default function ProductModal({ open, onClose, onSave, editProduct = null }) {
  const [form, setForm] = useState(EMPTY);

  useEffect(() => {
    if (open) setForm(editProduct ? { name: editProduct.name, stock: editProduct.stock, minStock: editProduct.minStock, cost: editProduct.cost, sale: editProduct.sale } : EMPTY);
  }, [open, editProduct]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = () => {
    if (!form.name.trim()) return alert('Name required');
    onSave({ ...form, name: form.name.trim(), stock: +form.stock || 0, minStock: +form.minStock || 10, cost: +form.cost || 0, sale: +form.sale || 0 }, editProduct?.id || null);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose}>
      <h2>{editProduct ? 'Edit Product' : 'Add Product'}</h2>
      <div className="form-grid">
        <div className="form-group full">
          <label>Product Name *</label>
          <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Surgical Gloves L" />
        </div>
        <div className="form-group">
          <label>Stock Quantity</label>
          <input type="number" min="0" value={form.stock} onChange={e => set('stock', e.target.value)} />
        </div>
        <div className="form-group">
          <label>Min Stock Alert</label>
          <input type="number" min="0" value={form.minStock} onChange={e => set('minStock', e.target.value)} />
        </div>
        <div className="form-group">
          <label>Cost Price (PKR)</label>
          <input type="number" min="0" value={form.cost} onChange={e => set('cost', e.target.value)} />
        </div>
        <div className="form-group">
          <label>Sale Price (PKR)</label>
          <input type="number" min="0" value={form.sale} onChange={e => set('sale', e.target.value)} />
        </div>
      </div>
      <div className="form-actions">
        <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" onClick={handleSave}>Save Product</button>
      </div>
    </Modal>
  );
}

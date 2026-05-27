import { useState } from 'react';
import { useData } from '../context/DataContext';
import ProductModal from '../components/modals/ProductModal';
import { IconEdit, IconTrash } from '../components/Icons';
import { fmt } from '../utils/helpers';
import { exportInventory } from '../utils/export';

export default function Inventory() {
  const { products, customersLedger, suppliersLedger, saveProduct, deleteProduct } = useData();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const stockCost = products.reduce((a, p) => a + p.stock * p.cost, 0);
  const stockSale = products.reduce((a, p) => a + p.stock * p.sale, 0);
  const recv = customersLedger.reduce((a, c) => a + Math.max(0, c.balance), 0);
  const pay = suppliersLedger.reduce((a, s) => a + Math.max(0, s.balance), 0);

  const list = search ? products.filter(p => p.name.toLowerCase().includes(search.toLowerCase())) : products;

  const openAdd = () => { setEditingProduct(null); setModalOpen(true); };
  const openEdit = p => { setEditingProduct(p); setModalOpen(true); };

  return (
    <div>
      <div className="cards-grid">
        <div className="card"><div className="card-label">Total Stock Cost</div><div className="card-value teal mono">{fmt(stockCost)}</div><div className="card-sub">Σ stock × cost</div></div>
        <div className="card"><div className="card-label">Total Stock Value (Sale)</div><div className="card-value green mono">{fmt(stockSale)}</div><div className="card-sub">Σ stock × sale</div></div>
        <div className="card"><div className="card-label">Total Receivables</div><div className="card-value blue mono">{fmt(recv)}</div><div className="card-sub">Customers owe you</div></div>
        <div className="card"><div className="card-label">Total Payables</div><div className="card-value amber mono">{fmt(pay)}</div><div className="card-sub">You owe suppliers</div></div>
      </div>

      <div className="table-wrap">
        <div className="table-header">
          <h3>Product Inventory</h3>
          <div className="toolbar">
            <div className="search-wrap">
              <input type="text" placeholder="Search products…" value={search} onChange={e => setSearch(e.target.value)} style={{ width: 180 }} />
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => exportInventory('xlsx', products)}>📤 Export</button>
            <button className="btn btn-primary btn-sm" onClick={openAdd}>+ Add Product</button>
          </div>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr><th>Product Name</th><th>Stock</th><th>Cost</th><th>Sale</th><th>Stock Value</th><th>Margin</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              {list.length ? list.map(p => {
                const margin = p.cost > 0 ? ((p.sale - p.cost) / p.cost * 100).toFixed(1) : 0;
                const low = p.stock <= p.minStock;
                const out = p.stock <= 0;
                return (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 500 }}>{p.name}</td>
                    <td className="mono" style={{ color: low ? 'var(--danger)' : 'var(--text)', fontWeight: low ? 700 : 400 }}>
                      {p.stock} {low && <span className="badge badge-red">LOW</span>}
                    </td>
                    <td className="mono">{fmt(p.cost)}</td>
                    <td className="mono">{fmt(p.sale)}</td>
                    <td className="mono">{fmt(p.stock * p.cost)}</td>
                    <td><span className={`badge ${+margin >= 20 ? 'badge-green' : 'badge-amber'}`}>{margin}%</span></td>
                    <td>
                      {out ? <span className="badge badge-red">Out</span>
                        : low ? <span className="badge badge-amber">Low</span>
                        : <span className="badge badge-green">OK</span>}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn-icon" onClick={() => openEdit(p)} title="Edit"><IconEdit /></button>
                        <button className="btn-icon" onClick={() => { if (confirm('Delete this product?')) deleteProduct(p.id); }} title="Delete"><IconTrash /></button>
                      </div>
                    </td>
                  </tr>
                );
              }) : <tr><td colSpan={8} className="empty"><p>No products yet</p></td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <ProductModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={(data, id) => saveProduct(data, id)}
        editProduct={editingProduct}
      />
    </div>
  );
}

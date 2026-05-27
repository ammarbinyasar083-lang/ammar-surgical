import { useData } from '../context/DataContext';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: <svg className="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg> },
  { id: 'sales', label: 'Sales', icon: <svg className="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/></svg> },
  { id: 'purchases', label: 'Purchases', icon: <svg className="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg> },
  { id: 'inventory', label: 'Inventory', icon: <svg className="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m7.5 4.27 9 5.15M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5M12 22V12"/></svg> },
  { id: 'ledgers', label: 'Ledgers', icon: <svg className="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg> },
  { id: 'balance', label: 'Balance Sheet', icon: <svg className="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="6" width="20" height="12" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/><circle cx="12" cy="14" r="1.5"/></svg> },
  { id: 'expenses', label: 'Expenses', icon: <svg className="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> },
  { id: 'reports', label: 'Reports', icon: <svg className="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> },
  { id: 'backup', label: 'Backup & Export', icon: <svg className="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> },
];

export default function Sidebar({ currentPage, onNavigate, isOpen }) {
  const { products, sales, purchases, settings, editBusinessName } = useData();

  const bizName = settings?.businessName || 'Ammar Surgical & Diagnostic';
  const bizSub = settings?.businessSub || 'Diagnostic & Wholesale Suite';
  const dbInfo = `${products.length} products · ${sales.length} sales · ${purchases.length} purchases`;

  return (
    <div id="sidebar" className={isOpen ? 'open' : ''}>
      <div className="logo" title="Go to Backup to edit business name" style={{ cursor: 'default' }}>
        <h2>⚕ {bizName}</h2>
        <p>{bizSub}</p>
      </div>
      <nav id="main-nav">
        {NAV_ITEMS.map(item => (
          <a
            key={item.id}
            data-page={item.id}
            className={currentPage === item.id ? 'active' : ''}
            onClick={() => onNavigate(item.id)}
          >
            {item.icon}
            {item.label}
          </a>
        ))}
      </nav>
      <div className="sidebar-footer">
        <small>{dbInfo}</small>
      </div>
    </div>
  );
}

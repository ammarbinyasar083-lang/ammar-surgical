import { useState } from 'react';
import { DataProvider, useData } from './context/DataContext';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import Dashboard from './pages/Dashboard';
import Sales from './pages/Sales';
import Purchases from './pages/Purchases';
import Inventory from './pages/Inventory';
import Ledgers from './pages/Ledgers';
import BalanceSheet from './pages/BalanceSheet';
import Expenses from './pages/Expenses';
import Reports from './pages/Reports';
import Backup from './pages/Backup';

const PAGE_TITLES = {
  dashboard: 'Dashboard',
  sales: 'Sales',
  purchases: 'Purchases',
  inventory: 'Inventory',
  ledgers: 'Ledgers',
  balance: 'Daily Balance Sheet',
  expenses: 'Expenses',
  reports: 'Reports',
  backup: 'Backup & Export',
};

const PAGES = {
  dashboard: Dashboard,
  sales: Sales,
  purchases: Purchases,
  inventory: Inventory,
  ledgers: Ledgers,
  balance: BalanceSheet,
  expenses: Expenses,
  reports: Reports,
  backup: Backup,
};

function AppInner() {
  const { isDark, products, sales } = useData();
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigate = page => {
    setCurrentPage(page);
    setSidebarOpen(false);
  };

  const handleGlobalSearch = val => {
    if (!val) return;
    const prods = products.filter(p => p.name.toLowerCase().includes(val.toLowerCase()));
    const s = sales.filter(s => s.customer.toLowerCase().includes(val.toLowerCase()));
    if (prods.length) navigate('inventory');
    else if (s.length) navigate('sales');
  };

  const PageComponent = PAGES[currentPage] || Dashboard;

  return (
    <div className={isDark ? '' : 'light'} style={{ display: 'flex', width: '100%', minHeight: '100vh', background: 'var(--bg)' }}>
      {sidebarOpen && (
        <div
          id="sidebar-overlay"
          style={{ display: 'block' }}
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <Sidebar
        currentPage={currentPage}
        onNavigate={navigate}
        isOpen={sidebarOpen}
      />
      <div id="main">
        <Topbar
          title={PAGE_TITLES[currentPage] || currentPage}
          onToggleSidebar={() => setSidebarOpen(o => !o)}
          onGlobalSearch={handleGlobalSearch}
        />
        <div className="page active" style={{ display: 'block', padding: 28 }}>
          <PageComponent onNavigate={navigate} />
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <DataProvider>
      <AppInner />
    </DataProvider>
  );
}

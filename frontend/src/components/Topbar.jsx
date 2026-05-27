import { useState } from 'react';
import { useData } from '../context/DataContext';
import { IconMoon, IconMenu, IconSearch } from './Icons';

export default function Topbar({ title, onToggleSidebar, onGlobalSearch }) {
  const { toggleDark } = useData();
  const [searchVal, setSearchVal] = useState('');

  const handleSearch = e => {
    const v = e.target.value;
    setSearchVal(v);
    onGlobalSearch?.(v);
  };

  return (
    <div className="topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button className="hamburger" onClick={onToggleSidebar}>
          <IconMenu />
        </button>
        <h1 id="page-title">{title}</h1>
      </div>
      <div className="topbar-right">
        <div className="search-wrap" style={{ display: 'flex', alignItems: 'center' }}>
          <span className="search-icon"><IconSearch /></span>
          <input
            type="text"
            placeholder="Search products, customers…"
            value={searchVal}
            onChange={handleSearch}
            style={{ width: 220 }}
          />
        </div>
        <button className="btn-icon" onClick={toggleDark} title="Toggle dark/light mode">
          <IconMoon />
        </button>
      </div>
    </div>
  );
}

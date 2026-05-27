import React, { createContext, useContext, useState, useMemo, useEffect, useCallback } from 'react';
import { uid, today, recomputeSale, recomputePurchase, addOneDay } from '../utils/helpers';
import { getCustomersLedger, getSuppliersLedger, computeBalanceForDate } from '../utils/ledger';

const DataContext = createContext(null);

const DEFAULT_PRODUCTS = [
  { id: uid(), name: 'Surgical Gloves (L)', stock: 150, minStock: 20, cost: 120, sale: 200 },
  { id: uid(), name: 'Disposable Syringe 5ml', stock: 500, minStock: 100, cost: 8, sale: 15 },
  { id: uid(), name: 'BP Apparatus Digital', stock: 12, minStock: 5, cost: 1800, sale: 2800 },
  { id: uid(), name: 'Surgical Mask (Box 50)', stock: 8, minStock: 15, cost: 350, sale: 600 },
  { id: uid(), name: 'IV Cannula 20G', stock: 200, minStock: 50, cost: 18, sale: 30 },
  { id: uid(), name: 'Glucose Meter', stock: 3, minStock: 5, cost: 2200, sale: 3500 },
];

const DEFAULT_SETTINGS = {
  businessName: 'Ammar Surgical & Diagnostic',
  businessSub: 'Diagnostic & Wholesale Suite',
  address: '',
  phone: '',
  autoBackup: false,
  lastBackup: null,
};

function useLocalStorage(key, defaultValue) {
  const [state, setState] = useState(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : defaultValue;
    } catch {
      return defaultValue;
    }
  });
  const setValue = useCallback(value => {
    setState(prev => {
      const next = typeof value === 'function' ? value(prev) : value;
      try { localStorage.setItem(key, JSON.stringify(next)); } catch { /* quota */ }
      return next;
    });
  }, [key]);
  return [state, setValue];
}

export function DataProvider({ children }) {
  const [products, setProducts] = useLocalStorage('products', DEFAULT_PRODUCTS);
  const [sales, setSales] = useLocalStorage('sales', []);
  const [purchases, setPurchases] = useLocalStorage('purchases', []);
  const [payments, setPayments] = useLocalStorage('payments', []);
  const [expenses, setExpenses] = useLocalStorage('expenses', []);
  const [settings, setSettings] = useLocalStorage('settings', DEFAULT_SETTINGS);
  const [sessions, setSessions] = useLocalStorage('closedDays', []);
  const [isDark, setIsDark] = useState(true);

  // One-time migration: ensure invoiceNo/purchaseNo exist
  useEffect(() => {
    setSales(prev => prev.map((s, i) => recomputeSale({
      ...s,
      invoiceNo: s.invoiceNo || 'INV-' + String(i + 1).padStart(4, '0'),
    })));
    setPurchases(prev => prev.map((p, i) => recomputePurchase({
      ...p,
      purchaseNo: p.purchaseNo || 'PUR-' + String(i + 1).padStart(4, '0'),
    })));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const sortedSessions = useMemo(
    () => [...sessions].sort((a, b) => b.date.localeCompare(a.date)),
    [sessions],
  );
  const activeSession = useMemo(
    () => sortedSessions.find(s => s.status === 'open') || null,
    [sortedSessions],
  );
  const lastClosedSession = useMemo(
    () => sortedSessions.find(s => s.status === 'closed') || null,
    [sortedSessions],
  );
  const customersLedger = useMemo(() => getCustomersLedger(sales, payments), [sales, payments]);
  const suppliersLedger = useMemo(() => getSuppliersLedger(purchases, payments), [purchases, payments]);

  const toggleDark = useCallback(() => setIsDark(d => !d), []);

  // ─── Products ───────────────────────────────────────────────────────────────
  const saveProduct = useCallback((data, editingId = null) => {
    setProducts(prev => {
      if (editingId) return prev.map(p => p.id === editingId ? { ...p, ...data } : p);
      return [...prev, { id: uid(), ...data }];
    });
  }, [setProducts]);

  const deleteProduct = useCallback(id => {
    setProducts(prev => prev.filter(p => p.id !== id));
  }, [setProducts]);

  // ─── Sales ──────────────────────────────────────────────────────────────────
  const saveSale = useCallback((saleData, items) => {
    const all = sales;
    const invoiceNo = 'INV-' + String(all.length + 1).padStart(4, '0');
    let { customer, date, paid, note } = saleData;
    const total = items.reduce((a, i) => a + i.qty * i.price, 0);
    if (paid > total) paid = total;
    const sale = recomputeSale({ id: uid(), invoiceNo, customer, date, items, total, paid, note });
    setSales(prev => [...prev, sale]);
    setProducts(prev => prev.map(p => {
      const item = items.find(i => i.productId === p.id);
      return item ? { ...p, stock: Math.max(0, p.stock - item.qty) } : p;
    }));
    return sale;
  }, [sales, setSales, setProducts]);

  const deleteSale = useCallback(id => {
    const sale = sales.find(s => s.id === id);
    if (!sale) return;
    setSales(prev => prev.filter(s => s.id !== id));
    setProducts(prev => prev.map(p => {
      const item = sale.items.find(i => i.productId === p.id);
      return item ? { ...p, stock: p.stock + item.qty } : p;
    }));
  }, [sales, setSales, setProducts]);

  const updateSalePaid = useCallback((id, newPaid) => {
    setSales(prev => prev.map(s => {
      if (s.id !== id) return s;
      return recomputeSale({ ...s, paid: Math.min(newPaid, s.total) });
    }));
  }, [setSales]);

  // ─── Purchases ──────────────────────────────────────────────────────────────
  const savePurchase = useCallback((purchaseData, items) => {
    const all = purchases;
    const purchaseNo = 'PUR-' + String(all.length + 1).padStart(4, '0');
    let { supplier, date, paid, note } = purchaseData;
    const total = items.reduce((a, i) => a + i.qty * i.cost, 0);
    if (paid > total) paid = total;
    const purchase = recomputePurchase({ id: uid(), purchaseNo, supplier, date, items, total, paid, note });
    setPurchases(prev => [...prev, purchase]);
    setProducts(prev => {
      const updated = [...prev];
      items.forEach(item => {
        const idx = updated.findIndex(p => p.name.toLowerCase() === item.name.toLowerCase());
        if (idx >= 0) {
          updated[idx] = { ...updated[idx], stock: updated[idx].stock + item.qty, cost: item.cost };
        } else {
          updated.push({ id: uid(), name: item.name, stock: item.qty, minStock: 10, cost: item.cost, sale: Math.round(item.cost * 1.4) });
        }
      });
      return updated;
    });
    return purchase;
  }, [purchases, setPurchases, setProducts]);

  const deletePurchase = useCallback(id => {
    const purchase = purchases.find(p => p.id === id);
    if (!purchase) return;
    setPurchases(prev => prev.filter(p => p.id !== id));
    setProducts(prev => prev.map(p => {
      const item = purchase.items.find(i => i.name.toLowerCase() === p.name.toLowerCase());
      return item ? { ...p, stock: Math.max(0, p.stock - item.qty) } : p;
    }));
  }, [purchases, setPurchases, setProducts]);

  const updatePurchasePaid = useCallback((id, newPaid) => {
    setPurchases(prev => prev.map(p => {
      if (p.id !== id) return p;
      return recomputePurchase({ ...p, paid: Math.min(newPaid, p.total) });
    }));
  }, [setPurchases]);

  // ─── Payment FIFO reallocation ───────────────────────────────────────────────
  const reallocate = useCallback((pay, delta, currentSales, currentPurchases) => {
    let updSales = [...currentSales];
    let updPurchases = [...currentPurchases];
    if (pay.type === 'customer') {
      const party = updSales.filter(s => s.customer === pay.party).sort((a, b) => a.date.localeCompare(b.date));
      let rem = delta;
      if (delta > 0) {
        for (const s of party) {
          const need = s.total - s.paid; if (need <= 0) continue;
          const apply = Math.min(need, rem);
          const i = updSales.findIndex(x => x.id === s.id);
          updSales[i] = recomputeSale({ ...updSales[i], paid: updSales[i].paid + apply });
          rem -= apply; if (rem <= 0.001) break;
        }
      } else {
        let toRemove = -delta;
        for (const s of [...party].reverse()) {
          if (s.paid <= 0) continue;
          const take = Math.min(s.paid, toRemove);
          const i = updSales.findIndex(x => x.id === s.id);
          updSales[i] = recomputeSale({ ...updSales[i], paid: updSales[i].paid - take });
          toRemove -= take; if (toRemove <= 0.001) break;
        }
      }
    } else {
      const party = updPurchases.filter(p => p.supplier === pay.party).sort((a, b) => a.date.localeCompare(b.date));
      let rem = delta;
      if (delta > 0) {
        for (const p of party) {
          const need = p.total - p.paid; if (need <= 0) continue;
          const apply = Math.min(need, rem);
          const i = updPurchases.findIndex(x => x.id === p.id);
          updPurchases[i] = recomputePurchase({ ...updPurchases[i], paid: updPurchases[i].paid + apply });
          rem -= apply; if (rem <= 0.001) break;
        }
      } else {
        let toRemove = -delta;
        for (const p of [...party].reverse()) {
          if (p.paid <= 0) continue;
          const take = Math.min(p.paid, toRemove);
          const i = updPurchases.findIndex(x => x.id === p.id);
          updPurchases[i] = recomputePurchase({ ...updPurchases[i], paid: updPurchases[i].paid - take });
          toRemove -= take; if (toRemove <= 0.001) break;
        }
      }
    }
    return { updSales, updPurchases };
  }, []);

  const savePayment = useCallback((paymentData, editingId = null) => {
    const { amount, date, note, type, party } = paymentData;
    let curSales = [...sales];
    let curPurchases = [...purchases];
    let newPayments = [...payments];
    if (editingId) {
      const old = newPayments.find(p => p.id === editingId);
      if (old) {
        const { updSales: s1, updPurchases: p1 } = reallocate(old, -old.amount, curSales, curPurchases);
        curSales = s1; curPurchases = p1;
        const idx = newPayments.findIndex(p => p.id === editingId);
        newPayments[idx] = { ...old, amount, date, note };
        const { updSales: s2, updPurchases: p2 } = reallocate(newPayments[idx], amount, curSales, curPurchases);
        curSales = s2; curPurchases = p2;
      }
    } else {
      const pay = { id: uid(), type, party, amount, date, note };
      newPayments = [...newPayments, pay];
      const { updSales, updPurchases } = reallocate(pay, amount, curSales, curPurchases);
      curSales = updSales; curPurchases = updPurchases;
    }
    setSales(curSales);
    setPurchases(curPurchases);
    setPayments(newPayments);
  }, [sales, purchases, payments, reallocate, setSales, setPurchases, setPayments]);

  const deletePayment = useCallback(id => {
    const pay = payments.find(p => p.id === id);
    if (!pay) return;
    const { updSales, updPurchases } = reallocate(pay, -pay.amount, sales, purchases);
    setSales(updSales);
    setPurchases(updPurchases);
    setPayments(prev => prev.filter(p => p.id !== id));
  }, [payments, sales, purchases, reallocate, setSales, setPurchases, setPayments]);

  // ─── Expenses ───────────────────────────────────────────────────────────────
  const saveExpense = useCallback((data, editingId = null) => {
    setExpenses(prev => {
      if (editingId) return prev.map(e => e.id === editingId ? { ...e, ...data } : e);
      return [...prev, { id: uid(), ...data }];
    });
  }, [setExpenses]);

  const deleteExpense = useCallback(id => {
    setExpenses(prev => prev.filter(e => e.id !== id));
  }, [setExpenses]);

  // ─── Sessions ───────────────────────────────────────────────────────────────
  const createSession = useCallback((date, opening) => {
    setSessions(prev => {
      const next = [...prev, {
        date, status: 'open', opening, openedAt: new Date().toISOString(),
        closing: null, closedAt: null,
        cashSales: 0, custPayments: 0, supplierCashOut: 0,
        expensesTotal: 0, netFlow: 0, dayProfit: 0, outstandingToday: 0,
      }];
      return next.sort((a, b) => b.date.localeCompare(a.date));
    });
  }, [setSessions]);

  const closeDay = useCallback((sessionDate, opening) => {
    const b = computeBalanceForDate(sessionDate, opening, sales, purchases, payments, expenses, products);
    setSessions(prev => prev.map(s => {
      if (s.date !== sessionDate || s.status !== 'open') return s;
      return {
        ...s, status: 'closed', closedAt: new Date().toISOString(),
        closing: b.closing, cashSales: b.cashSales, custPayments: b.custPayments,
        supplierCashOut: b.supplierCashOut, expensesTotal: b.expensesTotal,
        netFlow: b.netFlow, dayProfit: b.dayProfit, outstandingToday: b.outstandingToday,
        salesCount: b.sales.length, purchasesCount: b.pus.length,
      };
    }));
    return b;
  }, [sales, purchases, payments, expenses, products, setSessions]);

  const reopenDay = useCallback(date => {
    setSessions(prev => prev.map(s =>
      s.date === date && s.status === 'closed'
        ? { ...s, status: 'open', closedAt: null, closing: null }
        : s,
    ));
  }, [setSessions]);

  const getBalanceForDate = useCallback((date, opening) =>
    computeBalanceForDate(date, opening, sales, purchases, payments, expenses, products),
    [sales, purchases, payments, expenses, products],
  );

  // ─── Settings ───────────────────────────────────────────────────────────────
  const updateSettings = useCallback(data => {
    setSettings(prev => ({ ...prev, ...data }));
  }, [setSettings]);

  // ─── Backup ──────────────────────────────────────────────────────────────────
  const getFullBackup = useCallback(() => ({
    products, sales, purchases, payments, expenses, settings,
    closedDays: sessions, exportedAt: new Date().toISOString(), version: 2,
  }), [products, sales, purchases, payments, expenses, settings, sessions]);

  const restoreFromBackup = useCallback(data => {
    if (data.products) setProducts(data.products);
    if (data.sales) setSales(data.sales);
    if (data.purchases) setPurchases(data.purchases);
    if (data.payments) setPayments(data.payments);
    if (data.expenses) setExpenses(data.expenses);
    if (data.settings) setSettings(data.settings);
    if (data.closedDays) setSessions(data.closedDays);
  }, [setProducts, setSales, setPurchases, setPayments, setExpenses, setSettings, setSessions]);

  const wipeAllData = useCallback(() => {
    ['products', 'sales', 'purchases', 'payments', 'expenses', 'settings', 'closedDays']
      .forEach(k => localStorage.removeItem(k));
    window.location.reload();
  }, []);

  const value = {
    products, sales, purchases, payments, expenses, settings,
    sessions: sortedSessions, isDark,
    activeSession, lastClosedSession, customersLedger, suppliersLedger,
    toggleDark,
    saveProduct, deleteProduct,
    saveSale, deleteSale, updateSalePaid,
    savePurchase, deletePurchase, updatePurchasePaid,
    savePayment, deletePayment,
    saveExpense, deleteExpense,
    createSession, closeDay, reopenDay, getBalanceForDate, addOneDay,
    updateSettings,
    getFullBackup, restoreFromBackup, wipeAllData,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export const useData = () => {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
};

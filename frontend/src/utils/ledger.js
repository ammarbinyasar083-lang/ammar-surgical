import { fmt } from './helpers';

export function getCustomersLedger(sales, payments) {
  const custPayments = payments.filter(p => p.type === 'customer');
  const map = {};
  sales.forEach(s => {
    if (!map[s.customer]) map[s.customer] = { name: s.customer, transactions: [] };
    map[s.customer].transactions.push({
      kind: 'invoice',
      date: s.date,
      desc: `${s.invoiceNo || 'Invoice'} (${s.items.length} item${s.items.length > 1 ? 's' : ''})`,
      debit: s.total,
      credit: s.paid,
      ref: s.id,
      status: s.status,
    });
  });
  custPayments.forEach(p => {
    if (!map[p.party]) map[p.party] = { name: p.party, transactions: [] };
    map[p.party].transactions.push({
      kind: 'payment',
      date: p.date,
      desc: (p.note || 'Payment received') + ' — ' + fmt(p.amount),
      debit: 0,
      credit: 0,
      ref: p.id,
      displayAmount: p.amount,
    });
  });
  return Object.values(map).map(c => {
    const inv = c.transactions.filter(t => t.kind === 'invoice');
    c.totalDebit = inv.reduce((a, t) => a + t.debit, 0);
    c.totalCredit = inv.reduce((a, t) => a + t.credit, 0);
    c.balance = c.totalDebit - c.totalCredit;
    c.transactions.sort((a, b) => a.date.localeCompare(b.date));
    return c;
  }).filter(c => c.transactions.length);
}

export function getSuppliersLedger(purchases, payments) {
  const supPayments = payments.filter(p => p.type === 'supplier');
  const map = {};
  purchases.forEach(p => {
    if (!map[p.supplier]) map[p.supplier] = { name: p.supplier, transactions: [] };
    map[p.supplier].transactions.push({
      kind: 'purchase',
      date: p.date,
      desc: `${p.purchaseNo || 'Purchase'} (${p.items.length} item${p.items.length > 1 ? 's' : ''})`,
      debit: p.total,
      credit: p.paid,
      ref: p.id,
      status: p.status,
    });
  });
  supPayments.forEach(p => {
    if (!map[p.party]) map[p.party] = { name: p.party, transactions: [] };
    map[p.party].transactions.push({
      kind: 'payment',
      date: p.date,
      desc: (p.note || 'Payment made') + ' — ' + fmt(p.amount),
      debit: 0,
      credit: 0,
      ref: p.id,
      displayAmount: p.amount,
    });
  });
  return Object.values(map).map(s => {
    const pur = s.transactions.filter(t => t.kind === 'purchase');
    s.totalDebit = pur.reduce((a, t) => a + t.debit, 0);
    s.totalCredit = pur.reduce((a, t) => a + t.credit, 0);
    s.balance = s.totalDebit - s.totalCredit;
    s.transactions.sort((a, b) => a.date.localeCompare(b.date));
    return s;
  }).filter(s => s.transactions.length);
}

export function computeBalanceForDate(d, opening, sales, purchases, payments, expenses, products) {
  const daySales = sales.filter(s => s.date === d);
  const dayPurchases = purchases.filter(p => p.date === d);
  const dayPayments = payments.filter(p => p.date === d);
  const dayExpenses = expenses.filter(e => e.date === d);
  const cashSales = daySales.reduce((a, s) => a + s.paid, 0);
  const custPayments = dayPayments.filter(p => p.type === 'customer').reduce((a, p) => a + p.amount, 0);
  const supplierCashOut = dayPurchases.reduce((a, p) => a + p.paid, 0);
  const expensesTotal = dayExpenses.reduce((a, e) => a + Number(e.amount || 0), 0);
  const netFlow = cashSales + custPayments - supplierCashOut - expensesTotal;
  const closing = opening + netFlow;
  let dayProfit = 0;
  daySales.forEach(s => s.items.forEach(i => {
    const c = i.cost != null ? i.cost : (products.find(p => p.id === i.productId)?.cost || 0);
    dayProfit += (i.price - c) * i.qty;
  }));
  dayProfit -= expensesTotal;
  const outstandingToday = daySales.reduce((a, s) => a + (s.total - s.paid), 0);
  return {
    d, opening, cashSales, custPayments, supplierCashOut,
    expensesTotal, netFlow, closing, dayProfit, outstandingToday,
    sales: daySales, pus: dayPurchases, pays: dayPayments, exps: dayExpenses,
  };
}

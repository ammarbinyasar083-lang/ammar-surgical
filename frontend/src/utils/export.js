import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { today, fmt } from './helpers';
import { getCustomersLedger, getSuppliersLedger } from './ledger';

export function downloadBlob(blob, filename) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 100);
}

export function toCSV(headers, rows) {
  const esc = v => {
    v = v == null ? '' : String(v);
    return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
  };
  return '﻿' + [headers.join(','), ...rows.map(r => r.map(esc).join(','))].join('\n');
}

export function downloadCSV(name, headers, rows) {
  downloadBlob(new Blob([toCSV(headers, rows)], { type: 'text/csv;charset=utf-8' }), name + '.csv');
}

export function downloadXLSX(name, sheetName, headers, rows) {
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  const widths = headers.map((h, i) => ({
    wch: Math.max(String(h).length, ...rows.map(r => String(r[i] == null ? '' : r[i]).length)) + 2,
  }));
  ws['!cols'] = widths;
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0, 31));
  XLSX.writeFile(wb, name + '.xlsx');
}

export function downloadPDF(title, headers, rows, opts = {}, businessName = 'Ammar Surgical') {
  const doc = new jsPDF({ orientation: opts.landscape ? 'landscape' : 'portrait', unit: 'pt', format: 'a4' });
  doc.setFontSize(14); doc.setTextColor(0, 170, 140); doc.text(businessName, 40, 40);
  doc.setFontSize(10); doc.setTextColor(100); doc.text(title, 40, 58);
  doc.setFontSize(9); doc.text('Generated: ' + new Date().toLocaleString(), 40, 72);
  doc.autoTable({
    startY: 90, head: [headers], body: rows,
    styles: { fontSize: 9 }, headStyles: { fillColor: [20, 40, 60] },
    alternateRowStyles: { fillColor: [245, 248, 252] },
  });
  if (opts.totals) {
    const y = doc.lastAutoTable.finalY + 16;
    doc.setFontSize(10); doc.setTextColor(0);
    opts.totals.forEach((t, i) => doc.text(t, 40, y + i * 14));
  }
  doc.save(title.replace(/[^\w]+/g, '_') + '.pdf');
}

export function exportInvoicePdf(sale, settings) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const biz = settings?.businessName || 'Ammar Surgical';
  doc.setFontSize(16); doc.setTextColor(0, 170, 140); doc.text(biz, 40, 50);
  doc.setFontSize(9); doc.setTextColor(100);
  if (settings?.address) doc.text(settings.address, 40, 66);
  if (settings?.phone) doc.text('Tel: ' + settings.phone, 40, 78);
  doc.setFontSize(13); doc.setTextColor(0); doc.text('INVOICE', 430, 50);
  doc.setFontSize(9); doc.text(sale.invoiceNo || sale.id, 430, 66);
  doc.text('Date: ' + sale.date, 430, 78);
  doc.setFontSize(10); doc.text('Bill To: ' + sale.customer, 40, 110);
  doc.text('Status: ' + (sale.status || '').toUpperCase(), 40, 124);
  doc.autoTable({
    startY: 140,
    head: [['Product', 'Qty', 'Price', 'Total']],
    body: sale.items.map(i => [i.name, i.qty, fmt(i.price), fmt(i.total)]),
    styles: { fontSize: 9 }, headStyles: { fillColor: [20, 40, 60] },
  });
  const y = doc.lastAutoTable.finalY + 20;
  doc.setFontSize(10);
  doc.text('Total: ' + fmt(sale.total), 430, y);
  doc.text('Paid: ' + fmt(sale.paid), 430, y + 14);
  if (sale.total - sale.paid > 0) {
    doc.setTextColor(200, 0, 0);
    doc.text('Balance: ' + fmt(sale.total - sale.paid), 430, y + 28);
  }
  doc.save((sale.invoiceNo || sale.id) + '.pdf');
}

const SALES_HEADERS = ['Invoice #', 'Date', 'Customer', 'Items', 'Total', 'Paid', 'Balance', 'Status'];
const salesRows = list => list.map(s => [s.invoiceNo || s.id, s.date, s.customer, s.items.length, s.total, s.paid, s.total - s.paid, s.status]);

export function exportSales(fmtType, salesData, from = null, to = null) {
  let list = [...salesData];
  if (from) list = list.filter(s => s.date >= from);
  if (to) list = list.filter(s => s.date <= to);
  list.sort((a, b) => a.date.localeCompare(b.date));
  const name = 'sales_' + today();
  if (fmtType === 'csv') downloadCSV(name, SALES_HEADERS, salesRows(list));
  else if (fmtType === 'xlsx') downloadXLSX(name, 'Sales', SALES_HEADERS, salesRows(list));
  else {
    const totals = [
      `Records: ${list.length}`,
      `Total: ${fmt(list.reduce((a, s) => a + s.total, 0))}`,
      `Paid: ${fmt(list.reduce((a, s) => a + s.paid, 0))}`,
      `Outstanding: ${fmt(list.reduce((a, s) => a + (s.total - s.paid), 0))}`,
    ];
    downloadPDF('Sales Report', SALES_HEADERS, salesRows(list), { landscape: true, totals });
  }
}

const PURCH_HEADERS = ['Purchase #', 'Date', 'Supplier', 'Items', 'Total', 'Paid', 'Balance', 'Status'];
const purchRows = list => list.map(p => [p.purchaseNo || p.id, p.date, p.supplier, p.items.length, p.total, p.paid, p.total - p.paid, p.status]);

export function exportPurchases(fmtType, purchasesData, from = null, to = null) {
  let list = [...purchasesData];
  if (from) list = list.filter(p => p.date >= from);
  if (to) list = list.filter(p => p.date <= to);
  list.sort((a, b) => a.date.localeCompare(b.date));
  const name = 'purchases_' + today();
  if (fmtType === 'csv') downloadCSV(name, PURCH_HEADERS, purchRows(list));
  else if (fmtType === 'xlsx') downloadXLSX(name, 'Purchases', PURCH_HEADERS, purchRows(list));
  else {
    const totals = [
      `Records: ${list.length}`,
      `Total: ${fmt(list.reduce((a, p) => a + p.total, 0))}`,
      `Paid: ${fmt(list.reduce((a, p) => a + p.paid, 0))}`,
      `Outstanding: ${fmt(list.reduce((a, p) => a + (p.total - p.paid), 0))}`,
    ];
    downloadPDF('Purchases Report', PURCH_HEADERS, purchRows(list), { landscape: true, totals });
  }
}

const INV_HEADERS = ['Product', 'Stock', 'Min', 'Cost', 'Sale', 'Stock Value', 'Status'];
const invRows = list => list.map(p => [p.name, p.stock, p.minStock, p.cost, p.sale, p.stock * p.cost, p.stock <= 0 ? 'Out' : p.stock <= p.minStock ? 'Low' : 'OK']);

export function exportInventory(fmtType, products, lowOnly = false) {
  let list = lowOnly ? products.filter(p => p.stock <= p.minStock) : [...products];
  const name = (lowOnly ? 'low_stock_' : 'inventory_') + today();
  if (fmtType === 'csv') downloadCSV(name, INV_HEADERS, invRows(list));
  else if (fmtType === 'xlsx') downloadXLSX(name, 'Inventory', INV_HEADERS, invRows(list));
  else {
    const totals = [`Products: ${list.length}`, `Total Stock Value: ${fmt(list.reduce((a, p) => a + p.stock * p.cost, 0))}`];
    downloadPDF(lowOnly ? 'Low Stock Report' : 'Inventory Report', INV_HEADERS, invRows(list), { landscape: true, totals });
  }
}

const LEDGER_HEADERS = ['Party', 'Date', 'Description', 'Debit', 'Credit', 'Balance'];

export function exportLedger(fmtType, type, sales, purchases, payments) {
  const data = type === 'customer' ? getCustomersLedger(sales, payments) : getSuppliersLedger(purchases, payments);
  const rows = [];
  data.forEach(p => {
    let bal = 0;
    p.transactions.forEach(t => {
      bal += t.debit - t.credit;
      rows.push([p.name, t.date, t.desc, t.debit || '', t.credit || '', bal]);
    });
  });
  const name = type + '_ledger_' + today();
  if (fmtType === 'csv') downloadCSV(name, LEDGER_HEADERS, rows);
  else if (fmtType === 'xlsx') downloadXLSX(name, type === 'customer' ? 'Customers' : 'Suppliers', LEDGER_HEADERS, rows);
  else downloadPDF((type === 'customer' ? 'Customer' : 'Supplier') + ' Ledger', LEDGER_HEADERS, rows, { landscape: true });
}

const PAY_HEADERS = ['Date', 'Type', 'Party', 'Amount', 'Note'];

export function exportPayments(fmtType, payments) {
  const rows = [...payments].sort((a, b) => a.date.localeCompare(b.date)).map(p => [p.date, p.type, p.party, p.amount, p.note || '']);
  const name = 'payments_' + today();
  if (fmtType === 'csv') downloadCSV(name, PAY_HEADERS, rows);
  else if (fmtType === 'xlsx') downloadXLSX(name, 'Payments', PAY_HEADERS, rows);
  else downloadPDF('Payment History', PAY_HEADERS, rows);
}

export function exportExpenses(fmtType, expenses) {
  const headers = ['Date', 'Category', 'Description', 'Amount'];
  const rows = [...expenses].sort((a, b) => a.date.localeCompare(b.date)).map(e => [e.date, e.category || '', e.desc || '', e.amount]);
  const name = 'expenses_' + today();
  if (fmtType === 'csv') downloadCSV(name, headers, rows);
  else if (fmtType === 'xlsx') downloadXLSX(name, 'Expenses', headers, rows);
  else downloadPDF('Expenses Report', headers, rows);
}

export function exportBalanceSheet(fmtType, b) {
  const headers = ['Item', 'Amount (PKR)'];
  const rows = [
    ['Opening Cash', b.opening],
    ['+ Cash from Sales', b.cashSales],
    ['+ Customer Payments', b.custPayments],
    ['− Supplier Payments', -b.supplierCashOut],
    ['− Expenses', -b.expensesTotal],
    ['Net Cash Flow', b.netFlow],
    ['= Closing Cash', b.closing],
    ['Daily Profit', b.dayProfit],
    ['Daily Outstanding', b.outstandingToday],
  ];
  const name = 'balance_sheet_' + b.d;
  if (fmtType === 'xlsx') downloadXLSX(name, 'BalanceSheet', headers, rows);
  else downloadPDF('Daily Balance Sheet — ' + b.d, headers, rows);
}

export function exportClosedDays(fmtType, sessions) {
  const headers = ['Date', 'Status', 'Opening Cash', 'Cash Sales', 'Customer Payments', 'Supplier Out', 'Expenses', 'Net Flow', 'Closing Cash', 'Profit', 'Outstanding', 'Closed At'];
  const rows = sessions.map(r => [
    r.date, r.status, r.opening, r.cashSales || 0, r.custPayments || 0,
    r.supplierCashOut || 0, r.expensesTotal || 0, r.netFlow || 0,
    r.closing ?? '', r.dayProfit || 0, r.outstandingToday || 0,
    r.closedAt ? new Date(r.closedAt).toLocaleString() : '',
  ]);
  if (fmtType === 'xlsx') downloadXLSX('session_history', 'Sessions', headers, rows);
  else downloadCSV('session_history', headers, rows);
}
